import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mic, Square, Play, Pause, Share2, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

type CharacterId =
  | "hamoudi" | "zol" | "walid" | "jad"
  | "lulu" | "kandaka" | "umm" | "habboba";

type Character = {
  id: CharacterId;
  name: string;
  emoji: string;
  gender: "m" | "f";
  pitch: number;      // semitones shift (approx via playbackRate + resample)
  rate: number;       // playbackRate (time stretch effect)
  formant: number;    // additional rate factor for character flavor
};

const CHARACTERS: Character[] = [
  { id: "hamoudi",  name: "حمودي",     emoji: "👶", gender: "m", pitch: 7,   rate: 1.05, formant: 1.15 },
  { id: "zol",      name: "الزول",     emoji: "🧑", gender: "m", pitch: 0,   rate: 1.0,  formant: 1.0 },
  { id: "walid",    name: "الوالد",    emoji: "👨", gender: "m", pitch: -3,  rate: 0.95, formant: 0.92 },
  { id: "jad",      name: "الجد",      emoji: "👴", gender: "m", pitch: -6,  rate: 0.85, formant: 0.85 },
  { id: "lulu",     name: "لولو",      emoji: "👧", gender: "f", pitch: 8,   rate: 1.05, formant: 1.18 },
  { id: "kandaka",  name: "الكنداكة",  emoji: "👩", gender: "f", pitch: 4,   rate: 1.0,  formant: 1.08 },
  { id: "umm",      name: "الأم",      emoji: "👩‍🦰", gender: "f", pitch: 2,   rate: 0.98, formant: 1.02 },
  { id: "habboba",  name: "الحبوبة",   emoji: "👵", gender: "f", pitch: -2,  rate: 0.88, formant: 0.95 },
];

// Convert semitones to playback rate ratio
const semitonesToRate = (semi: number) => Math.pow(2, semi / 12);

// Render transformed audio offline using AudioContext
async function renderTransformed(
  inputBuffer: AudioBuffer,
  character: Character,
): Promise<AudioBuffer> {
  // Combined rate: pitch shift + character formant tweak
  const rate = semitonesToRate(character.pitch) * character.formant;
  // Time-stretch (separate from pitch, simulated by adjusting length)
  const stretch = 1 / character.rate;

  const newSampleRate = inputBuffer.sampleRate;
  const newLength = Math.floor((inputBuffer.length / rate) * stretch);

  const offline = new OfflineAudioContext(
    inputBuffer.numberOfChannels,
    Math.max(1, newLength),
    newSampleRate,
  );
  const src = offline.createBufferSource();
  src.buffer = inputBuffer;
  src.playbackRate.value = rate / stretch;

  // Light low/high shelf for warmth
  const filter = offline.createBiquadFilter();
  filter.type = character.pitch >= 0 ? "highshelf" : "lowshelf";
  filter.frequency.value = character.pitch >= 0 ? 3000 : 250;
  filter.gain.value = 3;

  src.connect(filter).connect(offline.destination);
  src.start(0);
  return await offline.startRendering();
}

// Encode AudioBuffer -> WAV Blob (browsers reliably play WAV; WhatsApp accepts audio attachments)
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const samples = buffer.length;
  const blockAlign = (numCh * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;
  const ab = new ArrayBuffer(bufferSize);
  const view = new DataView(ab);
  let offset = 0;
  const writeStr = (s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); };
  writeStr("RIFF");
  view.setUint32(offset, bufferSize - 8, true); offset += 4;
  writeStr("WAVE");
  writeStr("fmt ");
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, format, true); offset += 2;
  view.setUint16(offset, numCh, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, byteRate, true); offset += 4;
  view.setUint16(offset, blockAlign, true); offset += 2;
  view.setUint16(offset, bitDepth, true); offset += 2;
  writeStr("data");
  view.setUint32(offset, dataSize, true); offset += 4;

  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));
  let idx = offset;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(idx, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      idx += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

const VoiceChanger = () => {
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [originalMime, setOriginalMime] = useState<string>("audio/webm");
  const [selected, setSelected] = useState<CharacterId | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (!isRecording) return;
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 200);
    return () => clearInterval(id);
  }, [isRecording]);

  const drawWave = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const render = () => {
      analyser.getByteTimeDomainData(data);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "hsl(45 90% 55%)");
      grad.addColorStop(1, "hsl(150 60% 45%)");
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = grad;
      ctx.beginPath();
      const slice = w / data.length;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128.0;
        const y = (v * h) / 2;
        const x = i * slice;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Prefer ogg/opus (WhatsApp-friendly), fallback to webm/opus
      const candidates = [
        "audio/ogg;codecs=opus",
        "audio/webm;codecs=opus",
        "audio/webm",
      ];
      const mime = candidates.find((c) => MediaRecorder.isTypeSupported(c)) || "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      setOriginalMime(mr.mimeType || "audio/webm");
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const arr = await blob.arrayBuffer();
        const ctx = new AudioContext();
        const buf = await ctx.decodeAudioData(arr.slice(0));
        setOriginalBuffer(buf);
        ctx.close().catch(() => {});
        toast.success("تم الحفظ في الخزنة.. اختار شخصية!");
      };

      // Visualizer
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      setElapsed(0);
      setOriginalBuffer(null);
      setSelected(null);
      setPreviewBlob(null);
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      drawWave();
    } catch (e) {
      console.error(e);
      toast.error("ما قدرنا نفتح المايك. تأكد من الإذن.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setIsRecording(false);
  };

  const applyCharacter = async (char: Character) => {
    if (!originalBuffer) return;
    setIsProcessing(true);
    setSelected(char.id);
    try {
      const out = await renderTransformed(originalBuffer, char);
      const wav = audioBufferToWav(out);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(wav);
      setPreviewBlob(wav);
      setPreviewUrl(url);
      // Auto play
      requestAnimationFrame(() => {
        if (audioElRef.current) {
          audioElRef.current.src = url;
          audioElRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      });
    } catch (e) {
      console.error(e);
      toast.error("ما قدرنا نغير الصوت. جرب تاني.");
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    const el = audioElRef.current;
    if (!el || !previewUrl) return;
    if (el.paused) { el.play(); setIsPlaying(true); }
    else { el.pause(); setIsPlaying(false); }
  };

  const shareToWhatsApp = async () => {
    if (!previewBlob) return;
    const file = new File([previewBlob], `zoolkaarb-${selected ?? "voice"}.wav`, { type: "audio/wav" });
    const text = "مقلب من زول كـــــارب 🎤";
    try {
      // @ts-expect-error canShare files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "ZoolKaarb" });
        return;
      }
    } catch (e) {
      console.warn("share failed", e);
    }
    // Fallback: download then open WA
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank"), 500);
    toast("نزّلنا ليك الملف.. ارفقه في الواتساب");
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div dir="rtl" className="min-h-screen bg-background max-w-md mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
          aria-label="رجوع"
        >
          <ArrowRight className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1 text-start">
          <h1 className="text-base font-bold font-cairo text-foreground">غيّر صوتك</h1>
          <p className="text-[11px] text-muted-foreground">مختبر شخصيات الخال الصوتية</p>
        </div>
        <Wand2 className="w-5 h-5 text-gold" />
      </header>

      {/* Al-Khal tip */}
      <div className="mx-5 mt-4 rounded-2xl border border-gold/30 bg-gold/10 p-3">
        <p className="text-xs font-cairo text-foreground leading-relaxed">
          سجل كلامك يا هندسة.. ويلا نغير الصوت عشان نضبط المقلب 🎭
        </p>
      </div>

      {/* Recorder card */}
      <section className="mx-5 mt-4 rounded-3xl border border-border bg-card p-5 text-center">
        <div className="h-24 rounded-2xl bg-background/60 border border-border/60 overflow-hidden flex items-center justify-center">
          {isRecording ? (
            <canvas ref={canvasRef} width={400} height={96} className="w-full h-full" />
          ) : (
            <p className="text-xs text-muted-foreground font-cairo">
              {originalBuffer ? "تسجيلك جاهز ✅" : "اضغط لبدء التسجيل"}
            </p>
          )}
        </div>

        <p className="mt-3 text-sm font-mono text-foreground tabular-nums">{fmt(elapsed)}</p>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`mt-4 mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isRecording
              ? "bg-destructive text-destructive-foreground animate-pulse shadow-[0_0_30px_hsl(var(--destructive)/0.5)]"
              : "gradient-gold text-primary-foreground shadow-[0_0_30px_hsl(45_90%_55%/0.4)]"
          }`}
          aria-label={isRecording ? "إيقاف" : "تسجيل"}
        >
          {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
        </button>

        <p className="mt-3 text-[11px] text-muted-foreground font-cairo">
          {isRecording ? "الخال سامعك.." : "الصوت بيتسجل بصيغة Opus جاهزة للواتساب"}
        </p>
      </section>

      {/* Character Lab */}
      {originalBuffer && (
        <section className="mx-5 mt-5">
          <h2 className="text-sm font-bold font-cairo text-foreground mb-3 text-start">
            🎭 مختبر الشخصيات
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-muted-foreground font-cairo mb-2 text-start">رجال</p>
              <div className="grid grid-cols-4 gap-2">
                {CHARACTERS.filter((c) => c.gender === "m").map((c) => (
                  <CharCard key={c.id} char={c} active={selected === c.id} disabled={isProcessing} onPick={() => applyCharacter(c)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-cairo mb-2 text-start">نساء</p>
              <div className="grid grid-cols-4 gap-2">
                {CHARACTERS.filter((c) => c.gender === "f").map((c) => (
                  <CharCard key={c.id} char={c} active={selected === c.id} disabled={isProcessing} onPick={() => applyCharacter(c)} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Preview & Share */}
      {previewUrl && (
        <section className="mx-5 mt-5 rounded-3xl border border-nile/30 bg-nile/5 p-4">
          <audio
            ref={audioElRef}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-nile text-primary-foreground flex items-center justify-center active:scale-95"
              aria-label={isPlaying ? "إيقاف" : "تشغيل"}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ms-0.5" />}
            </button>
            <div className="flex-1 text-start">
              <p className="text-sm font-bold font-cairo text-foreground">تشغيل المعاينة</p>
              <p className="text-[11px] text-muted-foreground font-cairo">
                {CHARACTERS.find((c) => c.id === selected)?.name} — جرب شخصية تانية لمقلب أحلى
              </p>
            </div>
          </div>

          <button
            onClick={shareToWhatsApp}
            disabled={!previewBlob || isProcessing}
            className="mt-4 w-full py-3 rounded-2xl gradient-gold text-primary-foreground text-sm font-bold font-cairo flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            أرسل المقلب (واتساب)
          </button>
        </section>
      )}
    </div>
  );
};

const CharCard = ({
  char, active, disabled, onPick,
}: { char: Character; active: boolean; disabled: boolean; onPick: () => void }) => (
  <button
    onClick={onPick}
    disabled={disabled}
    className={`rounded-2xl border p-2.5 flex flex-col items-center gap-1 transition-all active:scale-95 disabled:opacity-50 ${
      active ? "border-gold bg-gold/15 shadow-[0_0_15px_hsl(45_90%_55%/0.35)]" : "border-border bg-card hover:border-gold/50"
    }`}
  >
    <span className="text-2xl leading-none">{char.emoji}</span>
    <span className="text-[11px] font-cairo font-semibold text-foreground">{char.name}</span>
  </button>
);

export default VoiceChanger;
