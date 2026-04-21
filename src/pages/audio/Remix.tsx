import { ArrowLeft, Download, Music2, Play, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";
import ZoolAdModal from "@/components/ZoolAdModal";
import StudioProgress from "@/components/audio/StudioProgress";
import {
  downloadBlob,
  loadAudioBuffer,
  renderMixWithDucking,
  synthesizeArabicToBuffer,
} from "@/lib/audioMixer";
import { REMIX_LIBRARY, getRemixById, type RemixClip } from "@/lib/remixLibrary";
import { pickRandomSignature } from "@/lib/alKhalSignature";
import { SignatureToggle } from "./MediaFactory";
import { toast } from "sonner";

const TOOL_ID = "remix";
type Slot = "start" | "middle" | "end";

const Remix = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits, consume } = useZoolCredits(TOOL_ID);

  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [slots, setSlots] = useState<Partial<Record<Slot, string>>>({});
  const [signature, setSignature] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [adOpen, setAdOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewClip = (clip: RemixClip) => {
    try {
      const u = new SpeechSynthesisUtterance(clip.text);
      u.lang = "ar-SA";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  };

  const startExport = async () => {
    if (credits <= 0) return setAdOpen(true);
    if (!musicFile) return toast.error(isRtl ? "ضيف الأغنية الأساسية" : "Add the base track");
    setBusy(true);
    setProgress(0.05);
    try {
      const music = await loadAudioBuffer(musicFile, (r) => setProgress(0.05 + r * 0.35));
      setProgress(0.45);

      const positions: Record<Slot, number> = {
        start: 0.5,
        middle: music.duration / 2,
        end: Math.max(0, music.duration - 4),
      };
      const voices = [];
      for (const slot of ["start", "middle", "end"] as Slot[]) {
        const id = slots[slot];
        if (!id) continue;
        const clip = getRemixById(id);
        if (!clip) continue;
        const buf = await synthesizeArabicToBuffer(clip.text, clip.approxSec);
        voices.push({ buffer: buf, startSec: positions[slot] });
      }
      if (signature) {
        const sigBuf = await synthesizeArabicToBuffer(pickRandomSignature(), 2.5);
        voices.push({ buffer: sigBuf, startSec: Math.max(0, music.duration - 2.5) });
      }

      const blob = await renderMixWithDucking({ music, voices, duckLevel: 0.25 }, (r) =>
        setProgress(0.5 + r * 0.5),
      );
      consume();
      downloadBlob(blob, `remix-alkhal-${Date.now()}.webm`);
      toast.success(isRtl ? "ريمكس جاهز!" : "Remix ready!");
    } catch (e) {
      console.error(e);
      toast.error(isRtl ? "في خلل، جرب تاني" : "Failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-24" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/audio-studio")} className="p-1.5 rounded-xl hover:bg-muted" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">{isRtl ? "ريمكس الخال" : "Al-Khal Remix"}</h1>
          <p className="text-[10px] text-muted-foreground">{isRtl ? `متبقي ${credits} فزعات` : `${credits} uses left`}</p>
        </div>
      </header>

      <div className="px-4 pt-4">
        <button onClick={() => fileRef.current?.click()} className="w-full rounded-2xl border border-dashed border-gold/40 bg-card/40 backdrop-blur p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 text-start min-w-0">
            <p className="text-sm font-bold font-cairo text-foreground">{isRtl ? "ضيف الأغنية الأساسية" : "Base track"}</p>
            <p className="text-[11px] text-muted-foreground font-cairo truncate">{musicFile?.name ?? (isRtl ? "MP3, WAV..." : "MP3, WAV...")}</p>
          </div>
          <Upload className="w-4 h-4 text-muted-foreground" />
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden"
          onChange={(e) => setMusicFile(e.target.files?.[0] ?? null)} />
      </div>

      {/* Timeline with remix slots */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-bold font-cairo text-muted-foreground mb-2">
          {isRtl ? "اختار مقدمة، تعليق وسط، وخاتمة" : "Pick intro, middle tag, outro"}
        </p>
        <div className="rounded-2xl border border-gold/30 bg-card/60 backdrop-blur p-5 relative">
          <div className="h-1 rounded-full bg-gradient-to-r from-gold/60 via-gold-glow/70 to-gold/60" />
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 flex justify-between">
            {(["start", "middle", "end"] as Slot[]).map((slot) => {
              const id = slots[slot];
              const clip = id ? getRemixById(id) : null;
              return (
                <button key={slot} onClick={() => setPickerSlot(slot)}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-[10px] font-bold font-cairo border-2 transition-all ${
                    clip ? "bg-secondary border-secondary text-secondary-foreground" : "bg-card border-gold/50 text-gold hover:bg-gold/10"
                  }`}>
                  <span className="text-lg leading-none">{clip?.emoji ?? "+"}</span>
                  {clip && <span className="mt-0.5 truncate max-w-[3rem]">{clip.labelAr.slice(0, 6)}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-12 flex justify-between text-[10.5px] font-cairo text-muted-foreground">
            <span>{isRtl ? "مقدمة" : "Intro"}</span>
            <span>{isRtl ? "وسط" : "Middle"}</span>
            <span>{isRtl ? "خاتمة" : "Outro"}</span>
          </div>
        </div>
      </div>

      <SignatureToggle value={signature} onChange={setSignature} isRtl={isRtl} />

      <div className="px-4 mt-5">
        <button onClick={startExport} disabled={busy}
          className="w-full py-3.5 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60">
          <Download className="w-4 h-4" />
          {credits > 0 ? (isRtl ? "صدّر الريمكس" : "Export") : (isRtl ? "شوف إعلان لتفتح الإكسبورت" : "Watch ad to unlock")}
        </button>
      </div>

      {/* Picker sheet */}
      {pickerSlot && (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur flex items-end sm:items-center justify-center p-4" onClick={() => setPickerSlot(null)}>
          <div className="w-full max-w-md rounded-3xl bg-card border border-gold/30 shadow-2xl p-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold font-cairo text-foreground">
                {isRtl ? "مكتبة بصمات الخال" : "Al-Khal's clip library"}
              </h3>
              <button onClick={() => setPickerSlot(null)} className="p-1 rounded-lg hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {REMIX_LIBRARY.map((clip) => (
                <div key={clip.id} className="rounded-2xl border border-border bg-background/60 p-3 flex items-center gap-3">
                  <span className="text-2xl">{clip.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold font-cairo text-foreground truncate">{clip.labelAr}</p>
                    <p className="text-[10.5px] text-muted-foreground font-cairo">~{clip.approxSec}s · {clip.kind}</p>
                  </div>
                  <button onClick={() => previewClip(clip)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center" aria-label="Preview">
                    <Play className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <button onClick={() => { setSlots((p) => ({ ...p, [pickerSlot]: clip.id })); setPickerSlot(null); }}
                    className="px-3 py-1.5 rounded-full gradient-gold text-primary-foreground text-xs font-bold font-cairo">
                    {isRtl ? "اختار" : "Pick"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <StudioProgress open={busy} progress={progress} isRtl={isRtl} />
      <ZoolAdModal open={adOpen} toolId={TOOL_ID} isRtl={isRtl} onClose={() => setAdOpen(false)} />
    </div>
  );
};

export default Remix;
