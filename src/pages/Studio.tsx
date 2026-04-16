import { ArrowLeft, Eraser, Wand2, Sparkles, Palette, Crop, Upload, Download, Loader2, RotateCcw, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/store/userStore";

type ActionId = "remove-bg" | "restore" | "enhance" | "filter-bw" | "filter-warm" | "filter-cool" | "crop";

const tools: { id: ActionId; labelAr: string; labelEn: string; icon: typeof Eraser }[] = [
  { id: "remove-bg", labelAr: "إزالة الخلفية", labelEn: "Remove BG", icon: Eraser },
  { id: "restore", labelAr: "ترميم", labelEn: "Restore", icon: Wand2 },
  { id: "enhance", labelAr: "تحسين", labelEn: "Enhance", icon: Sparkles },
  { id: "filter-bw", labelAr: "أبيض وأسود", labelEn: "B & W", icon: Palette },
  { id: "filter-warm", labelAr: "دافئ", labelEn: "Warm", icon: Palette },
  { id: "filter-cool", labelAr: "بارد", labelEn: "Cool", icon: Palette },
  { id: "crop", labelAr: "قص", labelEn: "Crop", icon: Crop },
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const Studio = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionId | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 8MB.", variant: "destructive" });
      return;
    }
    const base64 = await fileToBase64(file);
    setOriginalImage(base64);
    setCurrentImage(base64);
    setHistory([]);
  };

  const runAction = async (id: ActionId) => {
    if (!currentImage || loading) return;
    if (id === "crop") {
      toast({ title: isRtl ? "قريباً" : "Coming soon", description: isRtl ? "أداة القص قيد التطوير" : "Crop tool is in development." });
      return;
    }
    setLoading(true);
    setActiveAction(id);
    try {
      const { data, error } = await supabase.functions.invoke("photo-edit", {
        body: { imageBase64: currentImage, action: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("No image returned");
      setHistory((h) => [...h, currentImage]);
      setCurrentImage(data.imageUrl);
      toast({ title: isRtl ? "تمام!" : "Done!", description: isRtl ? "اتطبق التعديل بنجاح" : "Edit applied successfully." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: isRtl ? "ما زبط" : "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentImage(prev);
  };

  const reset = () => {
    setOriginalImage(null);
    setCurrentImage(null);
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-32" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors" aria-label="Back">
          <ArrowLeft className={`w-5 h-5 text-foreground ${isRtl ? "rotate-180" : ""}`} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold font-cairo text-foreground">ستوديو زول</h1>
          <p className="text-[10px] text-muted-foreground">Zool Studio — AI Photo Editor</p>
        </div>
        {currentImage && (
          <button onClick={reset} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground" aria-label="New photo">
            <ImageIcon className="w-5 h-5" />
          </button>
        )}
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {!currentImage ? (
        <div className="px-5 mt-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-3xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-center px-6">
              <p className="text-base font-bold font-cairo text-foreground">{isRtl ? "ارفع صورة عشان نبدأ" : "Upload a photo to start"}</p>
              <p className="text-[12px] text-muted-foreground mt-1">
                {isRtl ? "بعد كده تقدر تطبق كل أدوات الذكاء الاصطناعي على نفس الصورة" : "Then apply multiple AI tools on the same image"}
              </p>
            </div>
          </button>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {tools.slice(0, 6).map((t) => (
              <div key={t.id} className="rounded-xl bg-card border border-border p-3 flex flex-col items-center gap-1.5 opacity-60">
                <t.icon className="w-5 h-5 text-gold" />
                <p className="text-[10px] font-cairo text-foreground text-center leading-tight">{isRtl ? t.labelAr : t.labelEn}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 mt-4">
          <div
            className="rounded-2xl overflow-hidden border border-border min-h-[280px] flex items-center justify-center relative"
            style={{
              backgroundImage:
                "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          >
            <img src={currentImage} alt="Editing" className="w-full h-auto block" />
            {loading && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <p className="text-xs text-foreground font-cairo">{isRtl ? "الخال شغال على صورتك..." : "Al-Khal is editing your photo..."}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={undo}
              disabled={history.length === 0 || loading}
              className="flex-1 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground active:scale-95 disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isRtl ? "تراجع" : "Undo"}
            </button>
            <a
              href={currentImage}
              download="zool-studio-edit.png"
              className="flex-1 py-2.5 rounded-xl gradient-gold text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              {isRtl ? "حفظ" : "Save"}
            </a>
          </div>
        </div>
      )}

      {/* Bottom toolbar */}
      {currentImage && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-card/95 backdrop-blur-xl border-t border-border" dir={isRtl ? "rtl" : "ltr"}>
          <div className="max-w-md mx-auto px-3 py-3 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tools.map((t) => {
                const active = activeAction === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => runAction(t.id)}
                    disabled={loading}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border min-w-[68px] transition-all active:scale-95 disabled:opacity-50 ${
                      active ? "gradient-gold border-transparent text-primary-foreground" : "bg-background border-border text-foreground"
                    }`}
                  >
                    {active && loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <t.icon className="w-5 h-5" />
                    )}
                    <span className="text-[10px] font-cairo leading-tight text-center">{isRtl ? t.labelAr : t.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;
