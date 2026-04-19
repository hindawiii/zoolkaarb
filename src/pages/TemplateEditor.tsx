import { ArrowLeft, Download, Image as ImageIcon, Sparkles, Loader2, Type, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  consumePremiumUse,
  getPremiumRemaining,
  grantPremiumReward,
} from "@/lib/premiumQuota";
import RewardedAdModal from "@/components/studio/RewardedAdModal";

const TEMPLATE_META: Record<string, { titleAr: string; defaultText: string; gradient: string }> = {
  friday: { titleAr: "أدعية الجمعة", defaultText: "جمعة مباركة", gradient: "from-gold/40 via-sand to-gold/20" },
  morning: { titleAr: "أذكار الصباح", defaultText: "صباح الخير\nحبابك عشرة", gradient: "from-nile/40 via-sand to-nile/20" },
  evening: { titleAr: "أذكار المساء", defaultText: "مساء النور\nمساء الفل", gradient: "from-earth/40 via-sand to-earth/20" },
  whatsapp: { titleAr: "حالات واتساب", defaultText: "أبشر يا غالي", gradient: "from-sand-dark/40 via-sand to-gold/20" },
  wedding: { titleAr: "بطاقات أعراس", defaultText: "مبروك العرس\nألف مبروك", gradient: "from-gold/50 via-sand to-gold/30" },
  custom: { titleAr: "قالب مخصص", defaultText: "اكتب رسالتك هنا", gradient: "from-nile/30 via-sand to-gold/30" },
};

type FontDef = {
  id: string;
  labelAr: string;
  className: string;
  premium: boolean;
  preview: string;
};

// First 3 = free, rest are premium (require ad after 3 free uses)
const FONTS: FontDef[] = [
  { id: "tajawal", labelAr: "تجوّل", className: "font-cairo", premium: false, preview: "أبجد" },
  { id: "changa", labelAr: "تشانغا", className: "font-changa", premium: false, preview: "أبجد" },
  { id: "lemonada", labelAr: "ليموناضة", className: "font-lemonada", premium: false, preview: "أبجد" },
  { id: "reem-kufi", labelAr: "ريم كوفي", className: "font-reem-kufi", premium: true, preview: "أبجد" },
  { id: "amiri", labelAr: "أميري", className: "font-amiri", premium: true, preview: "أبجد" },
  { id: "aref-ruqaa", labelAr: "رقعة", className: "font-aref-ruqaa", premium: true, preview: "أبجد" },
];

type ColorDef = { id: string; labelAr: string; className: string; premium: boolean; swatch: string };

const COLORS: ColorDef[] = [
  { id: "white", labelAr: "أبيض", className: "text-white", premium: false, swatch: "#FFFFFF" },
  { id: "black", labelAr: "أسود", className: "text-black", premium: false, swatch: "#111111" },
  { id: "nile", labelAr: "نيلي", className: "text-nile", premium: false, swatch: "hsl(150 30% 45%)" },
  { id: "gold", labelAr: "ذهبي", className: "text-gradient-gold", premium: true, swatch: "linear-gradient(135deg,#FFD86B,#C4944A,#8B5E1A)" },
  { id: "bronze", labelAr: "برونزي", className: "text-gradient-bronze", premium: true, swatch: "linear-gradient(135deg,#E6A472,#B06A2E,#5C3210)" },
  { id: "silver", labelAr: "فضي", className: "text-gradient-silver", premium: true, swatch: "linear-gradient(135deg,#F4F4F4,#BFBFBF,#6E6E6E)" },
];

type EffectId = "auto" | "shadow" | "glow" | "glass" | "strip";
type EffectDef = { id: EffectId; labelAr: string; premium: boolean };

const EFFECTS: EffectDef[] = [
  { id: "auto", labelAr: "تلقائي", premium: false },
  { id: "shadow", labelAr: "ظل", premium: false },
  { id: "glow", labelAr: "توهج", premium: true },
  { id: "glass", labelAr: "زجاجي", premium: true },
  { id: "strip", labelAr: "شريط", premium: true },
];

const TemplateEditor = () => {
  const navigate = useNavigate();
  const { id = "custom" } = useParams();
  const meta = TEMPLATE_META[id] ?? TEMPLATE_META.custom;

  const [text, setText] = useState(meta.defaultText);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [fontId, setFontId] = useState<string>("tajawal");
  const [colorId, setColorId] = useState<string>("white");
  const [effect, setEffect] = useState<EffectId>("auto");

  const [premiumRemaining, setPremiumRemaining] = useState<number>(getPremiumRemaining());
  const [adOpen, setAdOpen] = useState(false);
  const pendingApply = useRef<(() => void) | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPremiumRemaining(getPremiumRemaining());
  }, []);

  // Try to apply a premium choice; if no quota left, queue it and open the ad.
  const tryPremium = (apply: () => void) => {
    if (premiumRemaining > 0) {
      const next = consumePremiumUse();
      setPremiumRemaining(next);
      apply();
      return;
    }
    pendingApply.current = apply;
    setAdOpen(true);
    toast({
      title: "يا هندسة، خلصت تجاربك المجانية",
      description: "أحضر إعلان سريع وعشّم الخال عشان نواصل الفزعة!",
    });
  };

  const onPickFont = (f: FontDef) => {
    if (!f.premium) {
      setFontId(f.id);
      return;
    }
    tryPremium(() => setFontId(f.id));
  };

  const onPickColor = (c: ColorDef) => {
    if (!c.premium) {
      setColorId(c.id);
      return;
    }
    tryPremium(() => setColorId(c.id));
  };

  const onPickEffect = (e: EffectDef) => {
    if (!e.premium) {
      setEffect(e.id);
      return;
    }
    tryPremium(() => setEffect(e.id));
  };

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleRemoveBg = async () => {
    if (!imageUrl) {
      toast({ title: "ارفع صورة الأول يا غالي", description: "Pick an image first." });
      return;
    }
    setRemovingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke("remove-bg", {
        body: { imageBase64: imageUrl },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setImageUrl(data.imageUrl);
        toast({ title: "تمام!", description: "Background removed by Al-Khal." });
      } else {
        throw new Error(data?.error || "No image returned");
      }
    } catch (e) {
      toast({
        title: "حصل خطأ",
        description: e instanceof Error ? e.message : "Background removal failed",
        variant: "destructive",
      });
    } finally {
      setRemovingBg(false);
    }
  };

  const handleDownload = async () => {
    if (!frameRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toJpeg(frameRef.current, { quality: 0.95, pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `al-wajib-${id}.jpg`;
      a.click();
    } catch (e) {
      toast({ title: "Export failed", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const activeFont = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
  const activeColor = COLORS.find((c) => c.id === colorId) ?? COLORS[0];

  // Effect styling on the text node — auto/shadow/glow live here; glass/strip
  // also wrap the text in a panel (handled below).
  const textShadow =
    effect === "shadow" || effect === "auto"
      ? "0 2px 10px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.45)"
      : effect === "glow"
        ? "0 0 14px hsl(var(--gold-glow) / 0.9), 0 0 28px hsl(var(--gold-glow) / 0.5)"
        : undefined;

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8" dir="rtl">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">{meta.titleAr}</h1>
          <p className="text-[10px] text-muted-foreground" dir="ltr">Status Maker</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/15 text-secondary text-[10px] font-bold font-cairo">
          <Sparkles className="w-3 h-3" />
          {premiumRemaining > 0 ? `${premiumRemaining} مميّز` : "إعلان"}
        </div>
        <button
          onClick={handleDownload}
          disabled={exporting}
          className="px-3 py-1.5 rounded-full gradient-gold text-primary-foreground text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span className="font-cairo">حفظ</span>
        </button>
      </header>

      {/* Frame / Preview */}
      <div className="px-5 mt-5">
        <div
          ref={frameRef}
          className={`relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br ${meta.gradient} border border-border shadow-lg`}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="user"
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {effect === "glass" ? (
              <div className="px-5 py-3 rounded-2xl backdrop-blur-md bg-white/15 border border-white/25">
                <p
                  dir="rtl"
                  className={`${activeFont.className} ${activeColor.className} font-bold text-center whitespace-pre-line text-2xl leading-snug`}
                  style={{ textShadow }}
                >
                  {text}
                </p>
              </div>
            ) : effect === "strip" ? (
              <div className="px-5 py-2 rounded-md bg-foreground/85">
                <p
                  dir="rtl"
                  className={`${activeFont.className} ${activeColor.className} font-bold text-center whitespace-pre-line text-2xl leading-snug`}
                  style={{ textShadow: undefined }}
                >
                  {text}
                </p>
              </div>
            ) : (
              <p
                dir="rtl"
                className={`${activeFont.className} ${activeColor.className} font-bold text-center whitespace-pre-line text-2xl leading-snug`}
                style={{ textShadow }}
              >
                {text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 mt-5 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2 font-cairo">
            <Type className="w-3.5 h-3.5" /> النص
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            dir="rtl"
            className="w-full rounded-2xl bg-card border border-border p-3 text-sm font-cairo text-foreground focus:outline-none focus:ring-2 focus:ring-gold/40 resize-none"
            placeholder="اكتب رسالتك..."
          />
        </div>

        {/* Font picker */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">الخط</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {FONTS.map((f) => {
              const active = f.id === fontId;
              return (
                <button
                  key={f.id}
                  onClick={() => onPickFont(f)}
                  className={`relative shrink-0 min-w-[68px] px-3 py-2 rounded-2xl border text-center transition-all ${
                    active
                      ? "border-gold bg-gold/10"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className={`block ${f.className} text-lg leading-none text-foreground`}>{f.preview}</span>
                  <span className="block mt-1 font-cairo text-[10px] text-muted-foreground">{f.labelAr}</span>
                  {f.premium && (
                    <Lock className="absolute top-1 left-1 w-2.5 h-2.5 text-gold" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">اللون</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => {
              const active = c.id === colorId;
              return (
                <button
                  key={c.id}
                  onClick={() => onPickColor(c)}
                  className={`relative w-11 h-11 rounded-full border-2 transition-all ${
                    active ? "border-gold scale-110" : "border-border"
                  }`}
                  style={{ background: c.swatch }}
                  aria-label={c.labelAr}
                  title={c.labelAr}
                >
                  {c.premium && (
                    <Lock className="absolute -top-1 -left-1 w-3 h-3 text-gold bg-card rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Effects */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 font-cairo">المؤثر</p>
          <div className="flex gap-2 flex-wrap">
            {EFFECTS.map((e) => {
              const active = e.id === effect;
              return (
                <button
                  key={e.id}
                  onClick={() => onPickEffect(e)}
                  className={`relative px-3 py-1.5 rounded-full text-xs font-cairo font-semibold border transition-all ${
                    active
                      ? "border-gold bg-gold/10 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {e.labelAr}
                  {e.premium && <Lock className="inline w-2.5 h-2.5 ms-1 text-gold" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl bg-card border border-border p-3 flex items-center justify-center gap-2 text-sm font-semibold text-foreground active:scale-95 transition-transform font-cairo"
          >
            <ImageIcon className="w-4 h-4 text-nile" />
            {imageUrl ? "تغيير الصورة" : "إضافة صورة"}
          </button>
          <button
            onClick={handleRemoveBg}
            disabled={removingBg || !imageUrl}
            className="rounded-2xl gradient-gold p-3 flex items-center justify-center gap-2 text-sm font-semibold text-primary-foreground active:scale-95 transition-transform disabled:opacity-60"
          >
            {removingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="font-cairo">بلمسة الخال</span>
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      </div>

      <RewardedAdModal
        open={adOpen}
        isRtl={true}
        onClose={() => {
          setAdOpen(false);
          pendingApply.current = null;
        }}
        onRewarded={() => {
          const next = grantPremiumReward();
          // Consume one immediately for the queued premium choice.
          const after = Math.max(0, next - 1);
          try {
            localStorage.setItem("zoolkaarb-premium-text-quota-v1", String(after));
          } catch {
            /* ignore */
          }
          setPremiumRemaining(after);
          pendingApply.current?.();
          pendingApply.current = null;
          toast({ title: "تمام يا هندسة!", description: "حصلت على 3 محاولات إضافية 🎉" });
        }}
      />
    </div>
  );
};

export default TemplateEditor;
