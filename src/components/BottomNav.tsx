import { Home, MessageCircle, ImagePlus, Settings, NotebookPen } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TOOLTIP_KEY = "zoolkaarb-voice-tooltip-seen";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useUser();
  const isAr = language === "ar";

  const [popping, setPopping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOOLTIP_KEY)) {
        const t1 = setTimeout(() => setShowTooltip(true), 800);
        const t2 = setTimeout(() => {
          setShowTooltip(false);
          try { localStorage.setItem(TOOLTIP_KEY, "1"); } catch { /* noop */ }
        }, 6500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
    } catch { /* noop */ }
  }, []);

  const home = { id: "/", label: t("nav.home", language), icon: Home };
  const chat = { id: "/chat", label: t("nav.chat", language), icon: MessageCircle };
  const studio = { id: "/studio", label: t("nav.studio", language), icon: ImagePlus };
  const settings = { id: "/settings", label: t("nav.settings", language), icon: Settings };

  // RTL visual order (right→left): Home, Chat, [Mufakkira], Studio, Settings
  // With dir="rtl", DOM order left→right renders as right→left visually.
  const right = [home, chat]; // appears on the right in RTL
  const left = [studio, settings]; // appears on the left in RTL

  const handleVoiceClick = () => {
    setPopping(true);
    setShowTooltip(false);
    try { localStorage.setItem(TOOLTIP_KEY, "1"); } catch { /* noop */ }
    window.dispatchEvent(new CustomEvent("zoolkaarb:open-voice-notes"));
    setTimeout(() => setPopping(false), 350);
  };

  const renderTab = (tab: { id: string; label: string; icon: typeof Home }) => {
    const isActive = location.pathname === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => navigate(tab.id)}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl transition-all w-full h-full",
          isActive ? "text-primary scale-105" : "text-muted-foreground",
        )}
      >
        <tab.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
        <span className="text-[10px] font-medium font-cairo leading-none">{tab.label}</span>
        {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border px-2 pb-safe z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="relative grid grid-cols-5 items-end h-16 max-w-md mx-auto">
        {/* RTL DOM order maps to visual right→left: Home, Chat, [Mufakkira], Studio, Settings */}
        <div className="flex items-end justify-center h-full">{renderTab(right[0])}</div>
        <div className="flex items-end justify-center h-full">{renderTab(right[1])}</div>

        {/* Center raised Mufakkira button */}
        <div className="relative flex justify-center h-full">
          <div className="absolute -top-7 flex flex-col items-center left-1/2 -translate-x-1/2">
            <button
              onClick={handleVoiceClick}
              aria-label={isAr ? "مفكرة الخال" : "Mufakkira"}
              className={cn(
                "w-16 h-16 rounded-full gradient-gold text-primary-foreground",
                "flex items-center justify-center shadow-[0_8px_24px_-6px_hsl(45_90%_55%/0.55)]",
                "ring-4 ring-background transition-transform active:scale-90",
                popping ? "animate-scale-in" : "hover:scale-105",
              )}
            >
              <NotebookPen className="w-7 h-7" strokeWidth={2.3} />
            </button>
            <span className="mt-1 text-[10px] font-medium font-cairo text-foreground leading-none">
              {isAr ? "المفكرة" : "Notes"}
            </span>

            {showTooltip && (
              <div
                className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fade-in"
                role="tooltip"
              >
                <div className="bg-foreground text-background text-[11px] font-cairo px-3 py-1.5 rounded-full shadow-lg">
                  {isAr ? "جديد: مفكرة الخال الذكية ✨" : "New: Al-Khal Smart Notes ✨"}
                </div>
                <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end justify-center h-full">{renderTab(left[0])}</div>
        <div className="flex items-end justify-center h-full">{renderTab(left[1])}</div>
      </div>
    </nav>
  );
};

export default BottomNav;
