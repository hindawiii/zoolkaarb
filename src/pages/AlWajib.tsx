import { ArrowLeft, Heart, Star, Sun, Moon, MessageCircle, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const templates = [
  { title: "Friday Blessings", titleAr: "أدعية الجمعة", icon: Star, color: "bg-gold/20", iconColor: "text-gold" },
  { title: "Morning Greetings", titleAr: "أذكار الصباح", icon: Sun, color: "bg-nile/20", iconColor: "text-nile" },
  { title: "Evening Greetings", titleAr: "أذكار المساء", icon: Moon, color: "bg-earth/20", iconColor: "text-earth-light" },
  { title: "WhatsApp Status", titleAr: "حالات واتساب", icon: MessageCircle, color: "bg-sand-dark/20", iconColor: "text-sand-dark" },
  { title: "Wedding Cards", titleAr: "بطاقات أعراس", icon: Heart, color: "bg-gold/20", iconColor: "text-gold" },
  { title: "Custom Templates", titleAr: "قوالب مخصصة", icon: Sparkles, color: "bg-nile/20", iconColor: "text-nile" },
];

const AlWajib = () => {
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold font-cairo text-foreground">الواجب</h1>
          <p className="text-[10px] text-muted-foreground">Al-Wajib — Templates & Greetings</p>
        </div>
      </header>

      <div className="px-5 mt-5">
        <div className="grid grid-cols-2 gap-3">
          {templates.map((t) => (
            <button
              key={t.title}
              onClick={() => setShowOverlay(true)}
              className="rounded-2xl bg-card border border-border p-4 text-left active:scale-[0.97] transition-transform"
            >
              <div className={`w-11 h-11 rounded-xl ${t.color} flex items-center justify-center mb-3`}>
                <t.icon className={`w-5 h-5 ${t.iconColor}`} />
              </div>
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              <p className="text-[11px] font-cairo text-earth-light mt-1" dir="rtl">{t.titleAr}</p>
            </button>
          ))}
        </div>
      </div>

      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowOverlay(false)}>
          <div className="bg-card border border-border rounded-2xl p-8 mx-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-cairo text-foreground">قريباً!</h3>
            <p className="text-sm text-muted-foreground mt-2">Coming Soon — Templates are under development.</p>
            <button onClick={() => setShowOverlay(false)} className="mt-5 px-6 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlWajib;
