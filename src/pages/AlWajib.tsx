import { ArrowLeft, Heart, Star, Sun, Moon, MessageCircle, Sparkles, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const templates = [
  { id: "friday", title: "Friday Blessings", titleAr: "أدعية الجمعة", icon: Star, color: "bg-gold/20", iconColor: "text-gold", isAd: false },
  { id: "morning", title: "Morning Greetings", titleAr: "أذكار الصباح", icon: Sun, color: "bg-nile/20", iconColor: "text-nile", isAd: false },
  { id: "evening", title: "Evening Greetings", titleAr: "أذكار المساء", icon: Moon, color: "bg-earth/20", iconColor: "text-earth-light", isAd: false },
  { id: "whatsapp", title: "WhatsApp Status", titleAr: "حالات واتساب", icon: MessageCircle, color: "bg-sand-dark/20", iconColor: "text-sand-dark", isAd: false },
  { id: "wedding", title: "Wedding Cards", titleAr: "بطاقات أعراس", icon: Heart, color: "bg-gold/20", iconColor: "text-gold", isAd: true },
  { id: "custom", title: "Custom Templates", titleAr: "قوالب مخصصة", icon: Sparkles, color: "bg-nile/20", iconColor: "text-nile", isAd: true },
];

const AlWajib = () => {
  const navigate = useNavigate();
  const [adTemplate, setAdTemplate] = useState<typeof templates[0] | null>(null);

  const handleClick = (t: typeof templates[0]) => {
    if (t.isAd) {
      setAdTemplate(t);
    } else {
      navigate(`/al-wajib/editor/${t.id}`);
    }
  };

  const watchAd = () => {
    if (!adTemplate) return;
    const id = adTemplate.id;
    setAdTemplate(null);
    // simulate reward then open editor
    setTimeout(() => navigate(`/al-wajib/editor/${id}`), 300);
  };

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
              key={t.id}
              onClick={() => handleClick(t)}
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

      {adTemplate && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setAdTemplate(null)}>
          <div className="bg-card border border-border rounded-2xl p-7 mx-6 text-center max-w-xs" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl gradient-gold mx-auto flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold font-cairo text-foreground">شاهد إعلان قصير</h3>
            <p className="text-sm text-muted-foreground mt-2 font-cairo" dir="rtl">
              يا غالي، شاهد إعلان قصير عشان تفتح قالب "{adTemplate.titleAr}" مجاناً.
            </p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setAdTemplate(null)} className="flex-1 px-4 py-2.5 rounded-full border border-border text-sm font-semibold active:scale-95 transition-transform">
                لاحقاً
              </button>
              <button onClick={watchAd} className="flex-1 px-4 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform">
                شاهد الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlWajib;
