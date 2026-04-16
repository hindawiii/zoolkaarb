import { ArrowLeft, ImagePlus, Eraser, Layers, Wand2, Crop, Palette, ScanLine, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const tools = [
  { title: "Merge Images", titleAr: "دمج الصور", icon: Layers, color: "bg-gold/20", iconColor: "text-gold" },
  { title: "Remove BG", titleAr: "إزالة الخلفية", icon: Eraser, color: "bg-nile/20", iconColor: "text-nile" },
  { title: "Restore Photo", titleAr: "ترميم الصور", icon: Wand2, color: "bg-earth/20", iconColor: "text-earth-light" },
  { title: "AI Enhance", titleAr: "تحسين بالذكاء", icon: Sparkles, color: "bg-gold/20", iconColor: "text-gold" },
  { title: "Crop & Resize", titleAr: "قص وتغيير", icon: Crop, color: "bg-nile/20", iconColor: "text-nile" },
  { title: "Color Filter", titleAr: "فلتر الألوان", icon: Palette, color: "bg-sand-dark/20", iconColor: "text-sand-dark" },
  { title: "Scan Document", titleAr: "مسح المستندات", icon: ScanLine, color: "bg-earth/20", iconColor: "text-earth-light" },
  { title: "Create Design", titleAr: "إنشاء تصميم", icon: ImagePlus, color: "bg-gold/20", iconColor: "text-gold" },
];

const Studio = () => {
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);

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
              key={tool.title}
              onClick={() => setShowOverlay(true)}
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
