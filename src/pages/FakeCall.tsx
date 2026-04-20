import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PhoneCall,
  Smartphone,
  Repeat,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useUser } from "@/store/userStore";
import { useZoolCredits } from "@/lib/zoolCredits";
import ZoolAdModal from "@/components/ZoolAdModal";
import {
  saveFakeCall,
  AVATAR_GRADIENT,
  VOICE_LINES_AR,
  type FakeCallAvatar,
  type FakeCallStyle,
} from "@/lib/fakeCallStore";

const TOOL_ID = "fake-call";

const DELAYS = [
  { label: "حالاً", labelEn: "Now", sec: 1 },
  { label: "10 ثواني", labelEn: "10s", sec: 10 },
  { label: "30 ثانية", labelEn: "30s", sec: 30 },
  { label: "دقيقة", labelEn: "1 min", sec: 60 },
  { label: "5 دقائق", labelEn: "5 min", sec: 300 },
];

const AVATARS: FakeCallAvatar[] = ["gold", "nile", "earth", "sand"];

const FakeCall = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const { credits, consume } = useZoolCredits(TOOL_ID);

  const [callerName, setCallerName] = useState("الخال");
  const [callerLabel, setCallerLabel] = useState(isRtl ? "جوال" : "Mobile");
  const [avatar, setAvatar] = useState<FakeCallAvatar>("gold");
  const [style, setStyle] = useState<FakeCallStyle>("ios");
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [delaySec, setDelaySec] = useState(10);
  const [autoRedial, setAutoRedial] = useState(false);
  const [redialAfterSec, setRedialAfterSec] = useState(15);
  const [adOpen, setAdOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const voiceLines = useMemo(() => VOICE_LINES_AR, []);

  const scheduleCall = () => {
    const cfg = {
      callerName: callerName || (isRtl ? "الخال" : "Al-Khal"),
      callerLabel: callerLabel || (isRtl ? "جوال" : "Mobile"),
      avatar,
      style,
      voiceLine: voiceLines[voiceIdx],
      autoRedial,
      redialAfterSec,
      scheduledAt: Date.now() + delaySec * 1000,
    };
    saveFakeCall(cfg);
    setScheduling(true);
    // Brief confirmation, then navigate at scheduled time
    setTimeout(() => {
      navigate("/fake-call/incoming");
    }, delaySec * 1000);
  };

  const handleStart = () => {
    if (credits <= 0) {
      setAdOpen(true);
      return;
    }
    consume();
    scheduleCall();
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-24" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <h1 className="text-base font-bold font-cairo text-foreground">
            {isRtl ? "فزعة الخال" : "Fake Call"}
          </h1>
          <p className="text-[10px] text-muted-foreground font-cairo">
            {isRtl
              ? `عندك ${credits} فزعات مجانية`
              : `${credits} free calls`}
          </p>
        </div>
        <div className="w-9" />
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Live preview */}
        <div className="rounded-3xl bg-card border border-border p-5 flex flex-col items-center text-center shadow-sm">
          <div
            className={`w-24 h-24 rounded-full ${AVATAR_GRADIENT[avatar]} flex items-center justify-center text-3xl font-bold text-primary-foreground font-cairo shadow-lg animate-pulse-glow`}
          >
            {(callerName || "?").trim().charAt(0)}
          </div>
          <p className="mt-3 text-lg font-bold font-cairo text-foreground">
            {callerName || (isRtl ? "الخال" : "Al-Khal")}
          </p>
          <p className="text-xs text-muted-foreground font-cairo">{callerLabel}</p>
          <span className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-cairo uppercase">
            {style === "ios" ? "iOS" : "Android"}
          </span>
        </div>

        {/* Caller info */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold font-cairo text-muted-foreground">
              {isRtl ? "اسم المتصل" : "Caller name"}
            </span>
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm font-cairo text-foreground focus:outline-none focus:border-gold"
              placeholder={isRtl ? "مثلاً: الخال" : "e.g. Al-Khal"}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold font-cairo text-muted-foreground">
              {isRtl ? "وصف الرقم" : "Number label"}
            </span>
            <input
              type="text"
              value={callerLabel}
              onChange={(e) => setCallerLabel(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm font-cairo text-foreground focus:outline-none focus:border-gold"
              placeholder={isRtl ? "مثلاً: جوال" : "e.g. Mobile"}
            />
          </label>
        </div>

        {/* Avatar */}
        <div>
          <p className="text-xs font-bold font-cairo text-muted-foreground mb-2">
            {isRtl ? "لون الصورة" : "Avatar color"}
          </p>
          <div className="flex gap-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`w-12 h-12 rounded-full ${AVATAR_GRADIENT[a]} ${
                  avatar === a ? "ring-2 ring-gold ring-offset-2 ring-offset-background" : ""
                } active:scale-95 transition-transform`}
                aria-label={a}
              />
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <p className="text-xs font-bold font-cairo text-muted-foreground mb-2">
            {isRtl ? "شكل الشاشة" : "Call screen style"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["ios", "android"] as FakeCallStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`py-3 rounded-2xl font-bold font-cairo text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform ${
                  style === s
                    ? "gradient-gold text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                {s === "ios" ? "iOS" : "Android"}
              </button>
            ))}
          </div>
        </div>

        {/* Voice line */}
        <div>
          <p className="text-xs font-bold font-cairo text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold" />
            {isRtl ? "صوت الخال (يشتغل لما ترد)" : "Voice line (plays on answer)"}
          </p>
          <div className="space-y-2">
            {voiceLines.map((line, i) => (
              <button
                key={i}
                onClick={() => setVoiceIdx(i)}
                className={`w-full text-start p-3 rounded-2xl font-cairo text-sm leading-relaxed transition ${
                  voiceIdx === i
                    ? "bg-gold/15 border-2 border-gold text-foreground"
                    : "bg-card border border-border text-muted-foreground"
                }`}
                dir="rtl"
              >
                {line}
              </button>
            ))}
          </div>
        </div>

        {/* Delay */}
        <div>
          <p className="text-xs font-bold font-cairo text-muted-foreground mb-2">
            {isRtl ? "متى ترن؟" : "When to ring?"}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {DELAYS.map((d) => (
              <button
                key={d.sec}
                onClick={() => setDelaySec(d.sec)}
                className={`py-2.5 rounded-xl text-[11px] font-bold font-cairo active:scale-95 transition ${
                  delaySec === d.sec
                    ? "gradient-gold text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                }`}
              >
                {isRtl ? d.label : d.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Auto-redial */}
        <div className="rounded-2xl bg-card border border-border p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-gold" />
              <div>
                <p className="text-sm font-bold font-cairo text-foreground">
                  {isRtl ? "إعادة الاتصال تلقائياً" : "Auto-redial"}
                </p>
                <p className="text-[10px] text-muted-foreground font-cairo">
                  {isRtl ? "لو رفضت المكالمة، يعاود الاتصال" : "Re-ring if declined"}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRedial}
              onChange={(e) => setAutoRedial(e.target.checked)}
              className="w-5 h-5 accent-[hsl(var(--gold))]"
            />
          </label>
          {autoRedial && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground font-cairo mb-1">
                {isRtl ? `يعاود بعد ${redialAfterSec} ثانية` : `Redial after ${redialAfterSec}s`}
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={redialAfterSec}
                onChange={(e) => setRedialAfterSec(Number(e.target.value))}
                className="w-full accent-[hsl(var(--gold))]"
              />
            </div>
          )}
        </div>

        {/* Start */}
        <button
          onClick={handleStart}
          disabled={scheduling}
          className="w-full py-4 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 shadow-lg"
        >
          <PhoneCall className="w-5 h-5" />
          {scheduling
            ? isRtl
              ? `جاهز... المكالمة بعد ${delaySec} ثانية`
              : `Ready... ringing in ${delaySec}s`
            : isRtl
              ? "ابدأ الفزعة"
              : "Start Fake Call"}
        </button>

        {credits === 0 && (
          <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs font-cairo text-destructive leading-relaxed">
              {isRtl
                ? "خلصت فزعاتك المجانية! اضغط ابدأ عشان تشوف إعلان قصير وترجع تتفزّع."
                : "Out of free calls! Tap start to watch a quick ad."}
            </p>
          </div>
        )}
      </div>

      <ZoolAdModal
        open={adOpen}
        toolId={TOOL_ID}
        isRtl={isRtl}
        onClose={() => setAdOpen(false)}
        onRewarded={() => {
          // immediately use one credit and schedule
          consume();
          scheduleCall();
        }}
      />
    </div>
  );
};

export default FakeCall;
