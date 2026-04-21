import { useEffect, useState } from "react";
import { Gift, Sparkles, X, Play } from "lucide-react";
import {
  ChestBundle,
  grantChestBundle,
  isChestAvailable,
  markChestOpened,
  rollChestBundle,
} from "@/lib/dailyChest";
import { useUser } from "@/store/userStore";

const AD_DURATION = 5;

const DailyChestModal = () => {
  const { language } = useUser();
  const isRtl = language === "ar";
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"intro" | "ad" | "open" | "claimed">("intro");
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION);
  const [bundle, setBundle] = useState<ChestBundle | null>(null);

  // Show on first mount once per day.
  useEffect(() => {
    const t = setTimeout(() => {
      if (isChestAvailable()) setOpen(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Ad countdown
  useEffect(() => {
    if (phase !== "ad") return;
    if (secondsLeft <= 0) {
      const b = rollChestBundle();
      setBundle(b);
      setPhase("open");
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  const claim = () => {
    if (bundle) grantChestBundle(bundle);
    markChestOpened();
    setPhase("claimed");
    setTimeout(() => setOpen(false), 1200);
  };

  const dismiss = () => {
    markChestOpened();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-background/85 backdrop-blur-md flex items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm rounded-3xl bg-card/90 backdrop-blur-2xl border border-gold/40 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground font-cairo flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            {isRtl ? "صندوق الخال اليومي" : "Daily Al-Khal Chest"}
          </p>
          {phase !== "ad" && (
            <button onClick={dismiss} className="p-1 rounded-lg hover:bg-muted" aria-label="Close">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="p-6 text-center">
          {phase === "intro" && (
            <>
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,hsl(var(--gold-glow)/0.5),transparent_70%)] animate-pulse-glow" />
                <div className="relative w-28 h-28 rounded-3xl gradient-gold flex items-center justify-center shadow-xl animate-float">
                  <Gift className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>
              <h3 className="mt-5 text-xl font-bold font-cairo text-foreground">
                {isRtl ? "الخال صبّح عليك! 🌅" : "Al-Khal greets you!"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground font-cairo leading-relaxed">
                {isRtl
                  ? "افتح الصندوق واحصل على مكافأة يومية"
                  : "Open the chest and grab today's reward"}
              </p>
              <button
                onClick={() => {
                  setSecondsLeft(AD_DURATION);
                  setPhase("ad");
                }}
                className="mt-6 w-full py-3 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Play className="w-4 h-4" />
                {isRtl ? "افتح الصندوق" : "Open the chest"}
              </button>
            </>
          )}

          {phase === "ad" && (
            <>
              <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-earth to-earth-light flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--gold-glow)/0.3),transparent_60%)]" />
                <p className="text-primary-foreground font-bold text-xl font-cairo z-10">
                  {isRtl ? "إعلان تجريبي" : "Demo Ad"}
                </p>
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-mono">
                  {secondsLeft}s
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground font-cairo">
                {isRtl ? "ثواني وبتفتح الصندوق..." : "Almost there..."}
              </p>
            </>
          )}

          {phase === "open" && bundle && (
            <>
              <div className="w-28 h-28 mx-auto rounded-3xl gradient-gold flex items-center justify-center glow-gold animate-pulse-glow">
                <Sparkles className="w-12 h-12 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-xl font-bold font-cairo text-foreground">
                {isRtl ? "مبروك يا هندسة! 🎉" : "Congrats!"}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-cairo">
                <RewardChip label={isRtl ? "ذكاء" : "AI"} amount={bundle.ai} />
                <RewardChip label={isRtl ? "فزعة" : "Fake Call"} amount={bundle.fakeCall} />
                <RewardChip label={isRtl ? "مكتب" : "Office"} amount={bundle.office} />
                <RewardChip label={isRtl ? "صوتيات" : "Audio"} amount={bundle.audio} />
              </div>
              <button
                onClick={claim}
                className="mt-5 w-full py-3 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo active:scale-95 transition-transform"
              >
                {isRtl ? "استلم المكافأة" : "Claim reward"}
              </button>
            </>
          )}

          {phase === "claimed" && (
            <div className="py-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <Gift className="w-9 h-9 text-secondary-foreground" />
              </div>
              <p className="mt-4 font-cairo font-bold text-foreground">
                {isRtl ? "تمام يا هندسة!" : "Done!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RewardChip = ({ label, amount }: { label: string; amount: number }) => (
  <div
    className={`rounded-xl border px-3 py-2 flex items-center justify-between ${
      amount > 0 ? "border-gold/40 bg-gold/10" : "border-border bg-muted/40 opacity-60"
    }`}
  >
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm font-bold text-foreground">+{amount}</span>
  </div>
);

export default DailyChestModal;
