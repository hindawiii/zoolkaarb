import { Sparkles } from "lucide-react";

const QuotaBadge = ({ remaining, isRtl }: { remaining: number; isRtl: boolean }) => (
  <div
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-cairo ${
      remaining > 0
        ? "bg-secondary/15 text-secondary"
        : "bg-destructive/15 text-destructive"
    }`}
  >
    <Sparkles className="w-3 h-3" />
    {remaining > 0
      ? isRtl
        ? `${remaining} مجاناً`
        : `${remaining} free`
      : isRtl
        ? "إعلان مطلوب"
        : "Ad required"}
  </div>
);

export default QuotaBadge;
