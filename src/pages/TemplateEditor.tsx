import { ArrowLeft, Download, Image as ImageIcon, Sparkles, Loader2, Type } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useRef, useState } from "react";
import { toJpeg } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const TEMPLATE_META: Record<string, { titleAr: string; defaultText: string; gradient: string }> = {
  friday: { titleAr: "أدعية الجمعة", defaultText: "جمعة مباركة", gradient: "from-gold/40 via-sand to-gold/20" },
  morning: { titleAr: "أذكار الصباح", defaultText: "صباح الخير\nحبابك عشرة", gradient: "from-nile/40 via-sand to-nile/20" },
  evening: { titleAr: "أذكار المساء", defaultText: "مساء النور\nمساء الفل", gradient: "from-earth/40 via-sand to-earth/20" },
  whatsapp: { titleAr: "حالات واتساب", defaultText: "أبشر يا غالي", gradient: "from-sand-dark/40 via-sand to-gold/20" },
  wedding: { titleAr: "بطاقات أعراس", defaultText: "مبروك العرس\nألف مبروك", gradient: "from-gold/50 via-sand to-gold/30" },
  custom: { titleAr: "قالب مخصص", defaultText: "اكتب رسالتك هنا", gradient: "from-nile/30 via-sand to-gold/30" },
};

const TemplateEditor = () => {
  const navigate = useNavigate();
  const { id = "custom" } = useParams();
  const meta = TEMPLATE_META[id] ?? TEMPLATE_META.custom;

  const [text, setText] = useState(meta.defaultText);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground" dir="rtl">{meta.titleAr}</h1>
          <p className="text-[10px] text-muted-foreground">Template Editor</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={exporting}
          className="px-3 py-1.5 rounded-full gradient-gold text-primary-foreground text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Download
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
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <p
              className="font-cairo font-bold text-foreground text-center whitespace-pre-line text-2xl leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
              dir="rtl"
            >
              {text}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 mt-5 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
            <Type className="w-3.5 h-3.5" /> Text on template
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

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl bg-card border border-border p-3 flex items-center justify-center gap-2 text-sm font-semibold text-foreground active:scale-95 transition-transform"
          >
            <ImageIcon className="w-4 h-4 text-nile" />
            {imageUrl ? "Change Image" : "Add Image"}
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
    </div>
  );
};

export default TemplateEditor;
