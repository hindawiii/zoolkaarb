import { Home, MessageCircle, ImagePlus, Settings, Mic } from "lucide-react";
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

  const sideTabs = [
    { id: "/", label: t("nav.home", language), icon: Home },
    { id: "/chat", label: t("nav.chat", language), icon: MessageCircle },
    { id: "/studio", label: t("nav.studio", language), icon: ImagePlus },
    { id: "/settings", label: t("nav.settings", language), icon: Settings },
  ];

  // RTL order requested: Settings → Studio → [Voice] → Al-Khal → Home
  // With dir="rtl" the visual right-to-left order matches array order, so:
  // Right-most first in RTL = Home. Array order: Home, Chat, [Voice], Studio, Settings.
  const left = isAr ? [sideTabs[0], sideTabs[1]] : [sideTabs[0], sideTabs[1]]; // Home, Chat
  const right = isAr ? [sideTabs[2], sideTabs[3]] : [sideTabs[2], sideTabs[3]]; // Studio, Settings

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
          "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all flex-1",
          isActive ? "text-primary scale-105" : "text-muted-foreground",
        )}
      >
        <tab.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
        <span className="text-[10px] font-medium font-cairo">{tab.label}</span>
        {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border px-2 pb-safe z-20"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="relative flex items-end justify-around h-16 max-w-md mx-auto">
        {left.map(renderTab)}

        {/* Center raised Voice button */}
        <div className="relative flex-1 flex justify-center">
          <div className="absolute -top-7 flex flex-col items-center">
            <button
              onClick={handleVoiceClick}
              aria-label={isAr ? "مفكرة الخال الصوتية" : "Voice Notes"}
              className={cn(
                "w-14 h-14 rounded-full gradient-gold text-primary-foreground",
                "flex items-center justify-center shadow-[0_8px_24px_-6px_hsl(45_90%_55%/0.55)]",
                "ring-4 ring-background transition-transform active:scale-90",
                popping ? "animate-scale-in" : "hover:scale-105",
              )}
            >
              <Mic className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <span className="mt-1 text-[10px] font-bold font-cairo text-foreground">
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

        {right.map(renderTab)}
      </div>
    </nav>
  );
};

export default BottomNav;
