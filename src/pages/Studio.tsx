import { ArrowLeft, ImagePlus, Eraser, Layers, Wand2, Crop, Palette, ScanLine, Sparkles, Upload, Download, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const tools = [
  { id: "merge", title: "Merge Images", titleAr: "دمج الصور", icon: Layers, color: "bg-gold/20", iconColor: "text-gold" },
  { id: "remove-bg", title: "Remove BG", titleAr: "إزالة الخلفية", icon: Eraser, color: "bg-nile/20", iconColor: "text-nile" },
  { id: "restore", title: "Restore Photo", titleAr: "ترميم الصور", icon: Wand2, color: "bg-earth/20", iconColor: "text-earth-light" },
  { id: "enhance", title: "AI Enhance", titleAr: "تحسين بالذكاء", icon: Sparkles, color: "bg-gold/20", iconColor: "text-gold" },
  { id: "crop", title: "Crop & Resize", titleAr: "قص وتغيير", icon: Crop, color: "bg-nile/20", iconColor: "text-nile" },
  { id: "filter", title: "Color Filter", titleAr: "فلتر الألوان", icon: Palette, color: "bg-sand-dark/20", iconColor: "text-sand-dark" },
  { id: "scan", title: "Scan Document", titleAr: "مسح المستندات", icon: ScanLine, color: "bg-earth/20", iconColor: "text-earth-light" },
  { id: "design", title: "Create Design", titleAr: "إنشاء تصميم", icon: ImagePlus, color: "bg-gold/20", iconColor: "text-gold" },
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
  const [showOverlay, setShowOverlay] = useState(false);
  const [showRemoveBg, setShowRemoveBg] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (id: string) => {
    if (id === "remove-bg") {
      setShowRemoveBg(true);
      setOriginalImage(null);
      setResultImage(null);
    } else {
      setShowOverlay(true);
    }
  };

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
    setResultImage(null);
  };

  const handleRemoveBackground = async () => {
    if (!originalImage) return;
    setLoading(true);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("remove-bg", {
        body: { imageBase64: originalImage },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("No image returned");
      setResultImage(data.imageUrl);
      toast({ title: "Done!", description: "Background removed successfully." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const closeRemoveBg = () => {
    setShowRemoveBg(false);
    setOriginalImage(null);
    setResultImage(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold font-cairo text-foreground">ستوديو زول</h1>
          <p className="text-[10px] text-muted-foreground">Zool Studio — AI Image Tools</p>
        </div>
      </header>

      <div className="px-5 mt-5">
        <div className="grid grid-cols-2 gap-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className="rounded-2xl bg-card border border-border p-4 text-left active:scale-[0.97] transition-transform"
            >
              <div className={`w-11 h-11 rounded-xl ${tool.color} flex items-center justify-center mb-3`}>
                <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
              </div>
              <p className="text-sm font-semibold text-foreground">{tool.title}</p>
              <p className="text-[11px] font-cairo text-earth-light mt-1" dir="rtl">{tool.titleAr}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Remove BG editor */}
      {showRemoveBg && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-md mx-auto min-h-screen flex flex-col">
            <header className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card/80 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-nile/20 flex items-center justify-center">
                  <Eraser className="w-4 h-4 text-nile" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Remove Background</h2>
                  <p className="text-[10px] font-cairo text-muted-foreground" dir="rtl">إزالة الخلفية</p>
                </div>
              </div>
              <button onClick={closeRemoveBg} className="p-1.5 rounded-xl hover:bg-muted">
                <X className="w-5 h-5 text-foreground" />
              </button>
            </header>

            <div className="flex-1 px-5 py-5 space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              {!originalImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Upload a photo</p>
                  <p className="text-[11px] font-cairo text-earth-light" dir="rtl">ارفع صورة من هاتفك</p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1.5 px-1">Original</p>
                    <div className="rounded-2xl overflow-hidden border border-border bg-muted">
                      <img src={originalImage} alt="Original" className="w-full h-auto" />
                    </div>
                  </div>

                  {(loading || resultImage) && (
                    <div>
                      <p className="text-[11px] text-muted-foreground mb-1.5 px-1">Result</p>
                      <div
                        className="rounded-2xl overflow-hidden border border-border min-h-[200px] flex items-center justify-center"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                        }}
                      >
                        {loading ? (
                          <div className="flex flex-col items-center gap-2 py-10">
                            <Loader2 className="w-7 h-7 text-gold animate-spin" />
                            <p className="text-xs text-muted-foreground">Processing with AI…</p>
                            <p className="text-[10px] font-cairo text-earth-light" dir="rtl">جاري المعالجة</p>
                          </div>
                        ) : resultImage ? (
                          <img src={resultImage} alt="Result" className="w-full h-auto" />
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="py-3 rounded-xl bg-card border border-border text-sm font-semibold text-foreground active:scale-95 disabled:opacity-50"
                    >
                      Change
                    </button>
                    {resultImage ? (
                      <a
                        href={resultImage}
                        download="zool-studio-no-bg.png"
                        className="py-3 rounded-xl gradient-gold text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Download className="w-4 h-4" /> Save
                      </a>
                    ) : (
                      <button
                        onClick={handleRemoveBackground}
                        disabled={loading}
                        className="py-3 rounded-xl gradient-gold text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {loading ? "Processing…" : "Remove BG"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowOverlay(false)}>
          <div className="bg-card border border-border rounded-2xl p-8 mx-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold font-cairo text-foreground">قريباً إن شاء الله!</h3>
            <p className="text-sm text-muted-foreground mt-2">Coming Soon — This tool is under development.</p>
            <button
              onClick={() => setShowOverlay(false)}
              className="mt-5 px-6 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;
