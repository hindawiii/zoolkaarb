import { ArrowLeft, User, Globe, Moon, Bell, Shield, Info, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { label: "Profile", labelAr: "الملف الشخصي", icon: User },
      { label: "Language", labelAr: "اللغة", icon: Globe, value: "EN / عربي" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Dark Mode", labelAr: "الوضع الداكن", icon: Moon, toggle: true },
      { label: "Notifications", labelAr: "الإشعارات", icon: Bell, toggle: true },
    ],
  },
  {
    title: "General",
    items: [
      { label: "Privacy Policy", labelAr: "سياسة الخصوصية", icon: Shield },
      { label: "About ZoolKaarb", labelAr: "عن زول كارب", icon: Info },
    ],
  },
];

const Settings = () => {
  const navigate = useNavigate();
  const [toggles, setToggles] = useState<Record<string, boolean>>({ "Dark Mode": false, Notifications: true });
  const [showOverlay, setShowOverlay] = useState(false);

  const handleToggle = (label: string) => {
    setToggles((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-8">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-base font-bold font-cairo text-foreground">الإعدادات</h1>
          <p className="text-[10px] text-muted-foreground">Settings</p>
        </div>
      </header>

      {/* Profile Card */}
      <div className="mx-5 mt-5 rounded-2xl gradient-sand border border-border p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
          <User className="w-6 h-6 text-gold" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold font-cairo text-foreground">يا زول</p>
          <p className="text-[11px] text-muted-foreground">Guest User — Sign in for more features</p>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="mt-5 space-y-5 px-5">
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.title}</p>
            <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (!item.toggle) setShowOverlay(true);
                    else handleToggle(item.label);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/50 transition-colors"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{item.label}</p>
                    <p className="text-[10px] font-cairo text-earth-light" dir="rtl">{item.labelAr}</p>
                  </div>
                  {item.toggle ? (
                    <div className={`w-10 h-6 rounded-full transition-colors ${toggles[item.label] ? "bg-primary" : "bg-muted"} relative`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${toggles[item.label] ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                    </div>
                  ) : item.value ? (
                    <span className="text-xs text-muted-foreground">{item.value}</span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-8">ZoolKaarb v1.0.0 — Made with ❤️ in Sudan</p>

      {/* Coming Soon Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowOverlay(false)}>
          <div className="bg-card border border-border rounded-2xl p-8 mx-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-cairo text-foreground">قريباً!</h3>
            <p className="text-sm text-muted-foreground mt-2">Coming Soon — This feature is under development.</p>
            <button onClick={() => setShowOverlay(false)} className="mt-5 px-6 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform">
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
