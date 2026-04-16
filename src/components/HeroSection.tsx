import { Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatarImg from "@/assets/wad-al-halal-avatar.png";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

const HeroSection = () => {
  const navigate = useNavigate();
  const { name, language } = useUser();
  return (
    <section className="mx-5 rounded-2xl gradient-sand border border-border p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gold/10 blur-2xl" />

      <div className="flex items-center gap-4">
        <div className="relative animate-float">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold glow-gold">
            <img src={avatarImg} alt="Al-Khal AI Assistant" width={80} height={80} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-nile border-2 border-background" />
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-bold font-cairo text-foreground">الخال</h2>
          <p className="text-xs text-muted-foreground">{t("hero.subtitle", language)}</p>
          <p className="text-xs text-earth-light mt-1 font-cairo" dir="rtl">
            {t("hero.welcome", "ar")}، {name}!
          </p>
        </div>

        <button
          onClick={() => navigate("/chat")}
          aria-label="Open chat"
          className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center animate-pulse-glow active:scale-95 transition-transform"
        >
          <Mic className="w-6 h-6 text-primary-foreground" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
