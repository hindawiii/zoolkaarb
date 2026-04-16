import { Home, MessageCircle, ImagePlus, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useUser();

  const tabs = [
    { id: "/", label: t("nav.home", language), icon: Home },
    { id: "/chat", label: t("nav.chat", language), icon: MessageCircle },
    { id: "/studio", label: t("nav.studio", language), icon: ImagePlus },
    { id: "/settings", label: t("nav.settings", language), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border px-2 pb-safe z-20" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive ? "text-primary scale-105" : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium font-cairo">{tab.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
