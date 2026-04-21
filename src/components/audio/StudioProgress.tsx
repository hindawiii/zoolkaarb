import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  open: boolean;
  /** 0..1 */
  progress: number;
  isRtl?: boolean;
  message?: string;
}

const DEFAULT_AR = "الخال بيمكسر ليك في اللحن.. ثواني ويكون كارب!";
const DEFAULT_EN = "Al-Khal is mixing your beat... almost ready!";

const StudioProgress = ({ open, progress, isRtl = true, message }: Props) => {
  if (!open) return null;
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <div
      className="fixed inset-0 z-[90] bg-background/85 backdrop-blur-md flex items-center justify-center p-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm rounded-3xl border border-gold/30 bg-card/80 backdrop-blur-2xl shadow-2xl p-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl gradient-gold flex items-center justify-center animate-pulse-glow">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="mt-4 text-base font-bold font-cairo text-foreground">
          {message ?? (isRtl ? DEFAULT_AR : DEFAULT_EN)}
        </h3>
        <div className="mt-5">
          <Progress value={pct} className="h-3 bg-muted" />
          <p className="mt-2 text-xs text-muted-foreground font-cairo">{pct}%</p>
        </div>
      </div>
    </div>
  );
};

export default StudioProgress;
