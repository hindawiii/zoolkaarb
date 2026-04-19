import { useEffect, useState } from "react";
import { Play, Gift, X } from "lucide-react";

interface Props {
  open: boolean;
  isRtl: boolean;
  onClose: () => void;
  onRewarded: () => void;
}

const DURATION = 5;

const RewardedAdModal = ({ open, isRtl, onClose, onRewarded }: Props) => {
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [watching, setWatching] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(DURATION);
      setWatching(false);
      setDone(false);
    }
  }, [open]);

  useEffect(() => {
    if (!watching || done) return;
    if (secondsLeft <= 0) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, secondsLeft, done]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground font-cairo">
            {isRtl ? "إعلان مكافأة" : "Rewarded Ad"}
          </p>
          {!watching && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted" aria-label="Close">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="p-6 text-center">
          {!watching && !done && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full gradient-gold flex items-center justify-center animate-pulse-glow">
                <Gift className="w-9 h-9 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-bold font-cairo text-foreground">
                {isRtl ? "يا هندسة، خلصت تجاربك المجانية" : "Free trials finished"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground font-cairo leading-relaxed">
                {isRtl
                  ? "أحضر إعلان سريع وعشّم الخال عشان نواصل الفزعة!"
                  : "Watch a quick ad and Al-Khal will hook you up with 3 more uses!"}
              </p>
              <button
                onClick={() => setWatching(true)}
                className="mt-5 w-full py-3 rounded-2xl gradient-gold text-primary-foreground font-bold font-cairo flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Play className="w-4 h-4" />
                {isRtl ? "شوف الإعلان (+3 محاولات)" : "Watch Ad (+3 uses)"}
              </button>
            </>
          )}

          {watching && !done && (
            <>
              <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-earth to-earth-light flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--gold-glow)/0.3),transparent_60%)]" />
                <p className="text-primary-foreground font-bold text-2xl font-cairo z-10">
                  {isRtl ? "إعلان تجريبي" : "Demo Ad"}
                </p>
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/50 text-white text-xs font-mono">
                  {secondsLeft}s
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground font-cairo">
                {isRtl ? "خليك معانا.. شوية وبتخلص" : "Hang on, almost done..."}
              </p>
            </>
          )}

          {done && (
            <>
              <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
                <Gift className="w-9 h-9 text-secondary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-bold font-cairo text-foreground">
                {isRtl ? "تمام يا هندسة!" : "Nice!"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground font-cairo">
                {isRtl ? "حصلت على 3 محاولات إضافية 🎉" : "You earned 3 more uses 🎉"}
              </p>
              <button
                onClick={() => {
                  onRewarded();
                  onClose();
                }}
                className="mt-5 w-full py-3 rounded-2xl bg-secondary text-secondary-foreground font-bold font-cairo active:scale-95 transition-transform"
              >
                {isRtl ? "يلا نواصل" : "Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardedAdModal;
