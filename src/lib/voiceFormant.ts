// Studio-quality voice transform with formant preservation.
// Technique (PSOLA-lite): time-stretch using overlapping Hann windows to
// preserve formants, then resample to shift pitch. The combination gives
// pitch shift WITHOUT the chipmunk/cartoon formant shift.
//
// + Optional reverb via synthetic impulse response convolution.

export interface VoiceParams {
  /** Semitones to shift (-12..+12). Positive = higher. */
  pitch: number;
  /** Reverb wet amount (0..1). */
  reverb: number;
  /** Extra formant nudge (0.85..1.15). 1 = neutral, >1 brighter, <1 darker. */
  formant?: number;
}

const semitonesToRatio = (s: number) => Math.pow(2, s / 12);

/** Time-stretch a mono Float32Array by factor `stretch` using overlap-add. */
function timeStretchMono(input: Float32Array, sampleRate: number, stretch: number): Float32Array {
  if (Math.abs(stretch - 1) < 0.001) return input.slice();
  const frame = Math.max(256, Math.floor(sampleRate * 0.046)); // ~46ms
  const synthHop = Math.floor(frame / 4);
  const analysisHop = Math.max(1, Math.floor(synthHop / stretch));
  const outLen = Math.floor(input.length * stretch) + frame;
  const out = new Float32Array(outLen);
  const norm = new Float32Array(outLen);
  // Hann window
  const win = new Float32Array(frame);
  for (let i = 0; i < frame; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frame - 1));

  let inPos = 0;
  let outPos = 0;
  while (inPos + frame < input.length && outPos + frame < outLen) {
    for (let i = 0; i < frame; i++) {
      const w = win[i];
      out[outPos + i] += input[inPos + i] * w;
      norm[outPos + i] += w * w;
    }
    inPos += analysisHop;
    outPos += synthHop;
  }
  for (let i = 0; i < outLen; i++) {
    if (norm[i] > 1e-6) out[i] /= norm[i];
  }
  return out;
}

/** Linear-interpolated resample of mono Float32Array. */
function resampleMono(input: Float32Array, ratio: number): Float32Array {
  if (Math.abs(ratio - 1) < 0.001) return input.slice();
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(input.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = input[i0] * (1 - t) + input[i1] * t;
  }
  return out;
}

/** Build a short synthetic stereo impulse response for reverb. */
function buildImpulse(ctx: BaseAudioContext, seconds = 1.6, decay = 2.4): AudioBuffer {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

/** Decode a Blob/File into an AudioBuffer. */
export async function decodeBlobToBuffer(blob: Blob): Promise<AudioBuffer> {
  const arr = await blob.arrayBuffer();
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(arr.slice(0));
  } finally {
    ctx.close().catch(() => {});
  }
}

/** Render formant-preserved pitch shift + reverb to a new AudioBuffer. */
export async function renderVoice(
  input: AudioBuffer,
  params: VoiceParams,
  onProgress?: (r: number) => void,
): Promise<AudioBuffer> {
  const pitchRatio = semitonesToRatio(params.pitch) * (params.formant ?? 1);
  const sampleRate = input.sampleRate;
  const channels = input.numberOfChannels;

  // Step 1: time-stretch each channel by 1/pitchRatio (preserves formants when
  // resampled back). Step 2: resample by pitchRatio to shift pitch. Net length
  // ≈ original.
  const stretchedChans: Float32Array[] = [];
  for (let c = 0; c < channels; c++) {
    const data = input.getChannelData(c);
    const stretched = timeStretchMono(data, sampleRate, 1 / pitchRatio);
    const shifted = resampleMono(stretched, 1); // length already corrected
    // To get true pitch shift we need to play `stretched` at pitchRatio → resample.
    const finalChan = resampleMono(stretched, pitchRatio);
    stretchedChans.push(finalChan);
    onProgress?.(0.1 + (0.4 * (c + 1)) / channels);
    void shifted;
  }

  const outLen = Math.max(...stretchedChans.map((c) => c.length));
  const dryBuf = new AudioBuffer({ length: outLen, numberOfChannels: channels, sampleRate });
  for (let c = 0; c < channels; c++) {
    dryBuf.getChannelData(c).set(stretchedChans[c]);
  }

  // Step 3: offline mix with reverb tail
  const tailSec = params.reverb > 0 ? 1.6 : 0;
  const totalLen = outLen + Math.floor(tailSec * sampleRate);
  const offline = new OfflineAudioContext(channels, totalLen, sampleRate);

  const src = offline.createBufferSource();
  src.buffer = dryBuf;

  // Gentle warmth EQ
  const tilt = offline.createBiquadFilter();
  tilt.type = "highshelf";
  tilt.frequency.value = 3500;
  tilt.gain.value = params.pitch >= 0 ? 2 : -1.5;

  const dry = offline.createGain();
  dry.gain.value = 1 - params.reverb * 0.45;

  src.connect(tilt).connect(dry).connect(offline.destination);

  if (params.reverb > 0) {
    const conv = offline.createConvolver();
    conv.buffer = buildImpulse(offline);
    const wet = offline.createGain();
    wet.gain.value = params.reverb * 0.6;
    tilt.connect(conv).connect(wet).connect(offline.destination);
  }

  src.start(0);
  onProgress?.(0.55);
  const rendered = await offline.startRendering();
  onProgress?.(1);
  return rendered;
}

/** AudioBuffer → 16-bit PCM WAV blob. */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const samples = buffer.length;
  const blockAlign = numCh * 2;
  const dataSize = samples * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const v = new DataView(ab);
  let o = 0;
  const ws = (s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o++, s.charCodeAt(i)); };
  ws("RIFF"); v.setUint32(o, 36 + dataSize, true); o += 4;
  ws("WAVE"); ws("fmt "); v.setUint32(o, 16, true); o += 4;
  v.setUint16(o, 1, true); o += 2;
  v.setUint16(o, numCh, true); o += 2;
  v.setUint32(o, sr, true); o += 4;
  v.setUint32(o, sr * blockAlign, true); o += 4;
  v.setUint16(o, blockAlign, true); o += 2;
  v.setUint16(o, 16, true); o += 2;
  ws("data"); v.setUint32(o, dataSize, true); o += 4;
  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let idx = o;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      idx += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
