import { Home, MessageCircle, ImagePlus, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const tabs = [
  { id: "/", label: "Home", icon: Home },
  { id: "/chat", label: "AI Chat", icon: MessageCircle },
  { id: "/studio", label: "Studio", icon: ImagePlus },
  { id: "/settings", label: "Settings", icon: Settings },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border px-2 pb-safe z-20">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon
                className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`}
              />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
