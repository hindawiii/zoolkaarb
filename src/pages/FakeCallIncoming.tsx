import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronUp,
} from "lucide-react";
import {
  loadFakeCall,
  clearFakeCall,
  AVATAR_GRADIENT,
  type FakeCallConfig,
} from "@/lib/fakeCallStore";
import {
  startRingtone,
  stopRingtone,
  speakArabic,
  stopSpeaking,
} from "@/lib/ringtone";

type Phase = "ringing" | "in-call" | "ended";

const formatTimer = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const FakeCallIncoming = () => {
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<FakeCallConfig | null>(null);
  const [phase, setPhase] = useState<Phase>("ringing");
  const [timer, setTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [slidePos, setSlidePos] = useState(0); // for iOS slide-to-answer
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const redialTimerRef = useRef<number | null>(null);

  // Load config once on mount
  useEffect(() => {
    const c = loadFakeCall();
    if (!c) {
      navigate("/fake-call", { replace: true });
      return;
    }
    setCfg(c);
  }, [navigate]);

  // Start ringing when ringing phase begins
  useEffect(() => {
    if (phase !== "ringing" || !cfg) return;
    startRingtone(cfg.ringtoneDataUrl ?? null);
    // Try to enter fullscreen for max realism
    try {
      const el = document.documentElement as any;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el).catch(() => {});
    } catch {
      /* ignore */
    }
    return () => stopRingtone();
  }, [phase, cfg]);

  // Timer for in-call
  useEffect(() => {
    if (phase !== "in-call") return;
    const id = window.setInterval(() => setTimer((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRingtone();
      stopSpeaking();
      if (redialTimerRef.current) window.clearTimeout(redialTimerRef.current);
    };
  }, []);

  if (!cfg) return null;

  const initial = cfg.callerName.trim().charAt(0) || "?";
  const isIos = cfg.style === "ios";

  const answer = () => {
    stopRingtone();
    setPhase("in-call");
    setTimer(0);
    // Speak the voice line (muted respects the mute toggle initially false)
    speakArabic(cfg.voiceLine, { female: cfg.voice === "khala" });
  };

  const decline = () => {
    stopRingtone();
    if (cfg.autoRedial) {
      // Schedule another ring
      redialTimerRef.current = window.setTimeout(() => {
        setSlidePos(0);
        setPhase("ringing");
      }, cfg.redialAfterSec * 1000);
      setPhase("ended");
    } else {
      clearFakeCall();
      navigate("/", { replace: true });
    }
  };

  const endCall = () => {
    stopSpeaking();
    clearFakeCall();
    navigate("/", { replace: true });
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (next) {
        stopSpeaking();
      } else {
        speakArabic(cfg.voiceLine);
      }
      return next;
    });
  };

  // iOS slide-to-answer handlers
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const max = rect.width - 56; // 56 = knob width
    const pos = Math.max(0, Math.min(max, x - 28));
    setSlidePos(pos);
    if (pos >= max - 4) {
      dragging.current = false;
      answer();
    }
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setSlidePos(0);
  };

  // ===== Ended state (waiting for auto-redial) =====
  if (phase === "ended") {
    return (
      <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <p className="text-sm font-cairo text-muted-foreground">
          الخال هيعاود الاتصال بعد {cfg.redialAfterSec} ثانية...
        </p>
        <button
          onClick={() => {
            if (redialTimerRef.current) window.clearTimeout(redialTimerRef.current);
            clearFakeCall();
            navigate("/", { replace: true });
          }}
          className="mt-6 px-5 py-2.5 rounded-full bg-card border border-border text-sm font-cairo"
        >
          إلغاء كلياً
        </button>
      </div>
    );
  }

  // ===== In-call =====
  if (phase === "in-call") {
    return (
      <div
        className={`fixed inset-0 z-[200] flex flex-col text-white ${
          isIos
            ? "bg-gradient-to-b from-[hsl(220_25%_15%)] via-[hsl(220_25%_8%)] to-black"
            : "bg-gradient-to-b from-[hsl(150_30%_25%)] to-[hsl(220_25%_8%)]"
        }`}
        dir="rtl"
      >
        {/* Subtle Zool Karb watermark */}
        <div className="absolute top-3 left-3 text-[10px] font-cairo text-white/40 tracking-wide">
          ✦ Zool Karb
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div
            className={`w-32 h-32 rounded-full ${AVATAR_GRADIENT[cfg.avatar]} flex items-center justify-center text-5xl font-bold shadow-2xl mb-6`}
          >
            {initial}
          </div>
          <p className="text-2xl font-bold font-cairo">{cfg.callerName}</p>
          <p className="text-sm text-white/60 font-cairo mt-1">{cfg.callerLabel}</p>
          <p className="mt-4 text-base font-mono text-white/80">{formatTimer(timer)}</p>
        </div>

        {/* Action grid */}
        <div className="px-8 pb-12">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl ${
                muted ? "bg-white/30" : "bg-white/10"
              } active:scale-95 transition`}
            >
              {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              <span className="text-[11px] font-cairo">{muted ? "كاتم" : "كتم"}</span>
            </button>
            <button
              onClick={() => setSpeaker((s) => !s)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl ${
                speaker ? "bg-white/30" : "bg-white/10"
              } active:scale-95 transition`}
            >
              {speaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              <span className="text-[11px] font-cairo">سماعة</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white/10 active:scale-95 transition opacity-60">
              <Phone className="w-6 h-6" />
              <span className="text-[11px] font-cairo">إضافة</span>
            </button>
          </div>

          <button
            onClick={endCall}
            className="w-16 h-16 mx-auto rounded-full bg-destructive flex items-center justify-center shadow-2xl active:scale-90 transition"
            aria-label="End call"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // ===== Ringing =====
  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col text-white ${
        isIos
          ? "bg-gradient-to-b from-[hsl(220_25%_15%)] via-[hsl(220_25%_8%)] to-black"
          : "bg-gradient-to-b from-[hsl(150_25%_20%)] to-black"
      }`}
      dir="rtl"
    >
      <div className="absolute top-3 left-3 text-[10px] font-cairo text-white/40 tracking-wide">
        ✦ Zool Karb
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-white/60 font-cairo mb-2">
          {isIos ? "مكالمة واردة..." : "مكالمة جوال"}
        </p>
        <div
          className={`w-36 h-36 rounded-full ${AVATAR_GRADIENT[cfg.avatar]} flex items-center justify-center text-6xl font-bold shadow-2xl animate-pulse-glow mb-6`}
        >
          {initial}
        </div>
        <p className="text-3xl font-bold font-cairo">{cfg.callerName}</p>
        <p className="text-sm text-white/60 font-cairo mt-1">{cfg.callerLabel}</p>
      </div>

      {/* Controls */}
      <div className="px-6 pb-12">
        {isIos ? (
          // iOS: slide to answer
          <div className="space-y-6">
            <div
              ref={sliderRef}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative w-full h-14 rounded-full bg-white/15 backdrop-blur overflow-hidden"
            >
              <div className="absolute inset-0 flex items-center justify-center text-sm font-cairo text-white/70 pointer-events-none">
                <ChevronUp className="w-4 h-4 mx-1 -rotate-90" />
                اسحب للرد
              </div>
              <button
                onPointerDown={onPointerDown}
                style={{ transform: `translateX(${slidePos}px)` }}
                className="absolute top-1 left-1 w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-lg touch-none"
                aria-label="Slide to answer"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            </div>
            <button
              onClick={decline}
              className="w-full py-3 rounded-full bg-white/10 text-white/80 text-sm font-cairo active:scale-95 transition"
            >
              تذكير لاحقاً / رفض
            </button>
          </div>
        ) : (
          // Android: two big buttons
          <div className="flex items-center justify-around">
            <button
              onClick={decline}
              className="flex flex-col items-center gap-2 active:scale-90 transition"
            >
              <span className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-2xl">
                <PhoneOff className="w-7 h-7 text-white" />
              </span>
              <span className="text-xs font-cairo text-white/70">رفض</span>
            </button>
            <button
              onClick={answer}
              className="flex flex-col items-center gap-2 active:scale-90 transition"
            >
              <span className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-2xl animate-pulse">
                <Phone className="w-7 h-7 text-white" />
              </span>
              <span className="text-xs font-cairo text-white/70">رد</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FakeCallIncoming;
