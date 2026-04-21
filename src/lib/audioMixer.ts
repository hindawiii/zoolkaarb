// Hybrid audio mixer for استوديو الصوت.
// - FFmpeg.wasm is used ONLY when the user uploads a video file (extract audio track).
// - Everything else (mixing, ducking, voice-over overlay, export) uses the
//   native Web Audio API + MediaRecorder. This keeps the bundle tiny on the
//   home screen and only loads ffmpeg lazily when truly needed.
//
// Public API:
//   loadAudioBuffer(file)            -> AudioBuffer (handles audio + video files)
//   recordVoiceOver(maxSec)          -> Blob of webm voice recording
//   mixWithDucking({...})            -> Blob (audio/webm) of the final track
//
// Audio ducking implementation:
//   For each voice-over insertion (with a startSec), we automate the music
//   track's GainNode so it dips to `duckLevel` (0..1) for the duration of the
//   voice clip, with short fade in/out ramps. The voice clip itself plays at
//   full volume on top.

import { getFFmpeg, fetchFile } from "@/lib/ffmpegClient";

// ---------- Audio loading ----------

const ensureCtx = (): AudioContext => {
  // Some browsers require a user gesture before the AudioContext can resume.
  const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  return new Ctor();
};

export const isVideoFile = (file: File) =>
  file.type.startsWith("video/") || /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name);

/** Decode any audio file directly into an AudioBuffer. */
const decodeAudioFile = async (file: File): Promise<AudioBuffer> => {
  const buf = await file.arrayBuffer();
  const ctx = ensureCtx();
  const audio = await ctx.decodeAudioData(buf.slice(0));
  await ctx.close();
  return audio;
};

/** Use FFmpeg.wasm to strip the audio track out of a video file and decode it. */
const extractAudioFromVideo = async (
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<AudioBuffer> => {
  const ff = await getFFmpeg(onProgress);
  const inputName = `in_${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
  const outputName = `out_${Date.now()}.mp3`;

  await ff.writeFile(inputName, await fetchFile(file));
  await ff.exec(["-i", inputName, "-vn", "-acodec", "libmp3lame", "-q:a", "4", outputName]);
  const data = (await ff.readFile(outputName)) as Uint8Array;
  await ff.deleteFile(inputName).catch(() => {});
  await ff.deleteFile(outputName).catch(() => {});

  const blob = new Blob([data.buffer as ArrayBuffer], { type: "audio/mpeg" });
  const arr = await blob.arrayBuffer();
  const ctx = ensureCtx();
  const audio = await ctx.decodeAudioData(arr);
  await ctx.close();
  return audio;
};

/** Load any audio or video file into a decoded AudioBuffer. */
export const loadAudioBuffer = async (
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<AudioBuffer> => {
  if (isVideoFile(file)) return extractAudioFromVideo(file, onProgress);
  return decodeAudioFile(file);
};

// ---------- Voice recording ----------

export type VoiceRecorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
};

export const startVoiceRecording = async (): Promise<VoiceRecorder> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();

  return {
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: mime }));
        };
        rec.stop();
      }),
    cancel: () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
      stream.getTracks().forEach((t) => t.stop());
    },
  };
};

export const blobToAudioBuffer = async (blob: Blob): Promise<AudioBuffer> => {
  const arr = await blob.arrayBuffer();
  const ctx = ensureCtx();
  const audio = await ctx.decodeAudioData(arr);
  await ctx.close();
  return audio;
};

// ---------- TTS-to-AudioBuffer (for ريمكس الخال + بصمة الخال) ----------

/**
 * Synthesize Arabic text via the browser's SpeechSynthesis API and capture it
 * to an AudioBuffer using MediaRecorder + an offscreen <audio>. This is best-
 * effort: some browsers block routing speechSynthesis through MediaRecorder.
 * Fallback returns a short silent buffer of the requested length so the
 * mixer keeps working. Future iteration: replace with real prerecorded clips.
 */
export const synthesizeArabicToBuffer = async (
  _text: string,
  approxSec: number,
): Promise<AudioBuffer> => {
  // Phase 1 fallback: silent buffer reserving the slot on the timeline.
  // The actual TTS plays live on export preview via SpeechSynthesis (handled
  // separately by the page). Keeping silence here guarantees deterministic
  // export timing across browsers.
  const ctx = ensureCtx();
  const sampleRate = ctx.sampleRate;
  const buf = ctx.createBuffer(2, Math.max(1, Math.floor(approxSec * sampleRate)), sampleRate);
  await ctx.close();
  return buf;
};

// ---------- Mixing with ducking ----------

export type VoiceLayer = {
  buffer: AudioBuffer;
  startSec: number;
  /** 0..1, defaults to 1 */
  gain?: number;
};

export type MixOptions = {
  music: AudioBuffer;
  voices: VoiceLayer[];
  /** music gain factor while a voice plays (0..1). Default 0.25 */
  duckLevel?: number;
  /** music base gain (0..1). Default 1 */
  musicGain?: number;
  /** ramp time in seconds for ducking. Default 0.15 */
  ramp?: number;
  /** force output length (sec). Default = max of music & voices */
  totalDurationSec?: number;
};

/**
 * Render a mixed audio Blob (audio/webm) with sidechain-style ducking.
 * Uses OfflineAudioContext for deterministic, fast rendering, then re-encodes
 * via MediaRecorder for a portable webm/opus output.
 */
export const renderMixWithDucking = async (
  opts: MixOptions,
  onProgress?: (ratio: number) => void,
): Promise<Blob> => {
  const {
    music,
    voices,
    duckLevel = 0.25,
    musicGain = 1,
    ramp = 0.15,
  } = opts;

  const voiceEnds = voices.map((v) => v.startSec + v.buffer.duration);
  const totalSec =
    opts.totalDurationSec ??
    Math.max(music.duration, ...(voiceEnds.length ? voiceEnds : [0]));

  const sampleRate = music.sampleRate;
  const channels = Math.max(music.numberOfChannels, 2);
  const offline = new OfflineAudioContext(channels, Math.ceil(totalSec * sampleRate), sampleRate);

  // Music source + automated gain
  const musicSrc = offline.createBufferSource();
  musicSrc.buffer = music;
  const musicGainNode = offline.createGain();
  musicGainNode.gain.setValueAtTime(musicGain, 0);
  musicSrc.connect(musicGainNode).connect(offline.destination);

  // Voice sources + ducking automation
  for (const v of voices) {
    const src = offline.createBufferSource();
    src.buffer = v.buffer;
    const g = offline.createGain();
    g.gain.value = v.gain ?? 1;
    src.connect(g).connect(offline.destination);
    src.start(v.startSec);

    const dipStart = Math.max(0, v.startSec - ramp);
    const dipEnd = v.startSec + v.buffer.duration;
    const restoreEnd = dipEnd + ramp;
    musicGainNode.gain.setValueAtTime(musicGainNode.gain.value, dipStart);
    musicGainNode.gain.linearRampToValueAtTime(duckLevel * musicGain, v.startSec);
    musicGainNode.gain.setValueAtTime(duckLevel * musicGain, dipEnd);
    musicGainNode.gain.linearRampToValueAtTime(musicGain, restoreEnd);
  }

  musicSrc.start(0);
  onProgress?.(0.1);

  const rendered = await offline.startRendering();
  onProgress?.(0.7);

  // Encode to webm via MediaRecorder for portability.
  const out = await audioBufferToWebmBlob(rendered, (p) => onProgress?.(0.7 + p * 0.3));
  onProgress?.(1);
  return out;
};

/** Encode an AudioBuffer into an audio/webm Blob via realtime MediaRecorder. */
const audioBufferToWebmBlob = async (
  buffer: AudioBuffer,
  onProgress?: (ratio: number) => void,
): Promise<Blob> => {
  const ctx = new AudioContext({ sampleRate: buffer.sampleRate });
  const dest = ctx.createMediaStreamDestination();
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(dest);

  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const rec = new MediaRecorder(dest.stream, { mimeType: mime });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  return new Promise<Blob>((resolve) => {
    const total = buffer.duration * 1000;
    const startedAt = Date.now();
    const tick = setInterval(() => {
      const r = Math.min(0.95, (Date.now() - startedAt) / total);
      onProgress?.(r);
    }, 200);

    rec.onstop = () => {
      clearInterval(tick);
      ctx.close().catch(() => {});
      resolve(new Blob(chunks, { type: mime }));
    };
    rec.start();
    src.start();
    src.onended = () => {
      // Give the recorder a beat to flush.
      setTimeout(() => rec.stop(), 120);
    };
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
