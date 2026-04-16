import { MapPin, FileDown, Gift, Share2, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const utilities = [
  {
    title: "Al-Zool Yafatish",
    titleAr: "الزول يفتش",
    desc: "Find pharmacies, hospitals & restaurants",
    icon: MapPin,
    color: "text-nile",
    bg: "bg-nile-light",
    route: null,
  },
  {
    title: "Data Saver",
    titleAr: "موفر البيانات",
    desc: "Compress images & files",
    icon: FileDown,
    color: "text-gold",
    bg: "bg-gold/10",
    route: "/data-saver",
  },
  {
    title: "Zool Share",
    titleAr: "زول شير",
    desc: "Share files via WhatsApp & more",
    icon: Share2,
    color: "text-sand-dark",
    bg: "bg-sand-dark/20",
    route: "/zool-share",
  },
  {
    title: "Scanner",
    titleAr: "ماسح المستندات",
    desc: "Scan documents to PDF",
    icon: ScanLine,
    color: "text-nile",
    bg: "bg-nile/20",
    route: "/scanner",
  },
  {
    title: "Rewarded Ads",
    titleAr: "إعلانات مكافأة",
    desc: "Unlock premium templates",
    icon: Gift,
    color: "text-earth-light",
    bg: "bg-sand",
    route: null,
  },
];

const UtilityScroll = () => {
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold text-foreground px-5 mb-3">
        Utilities
      </h3>
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
        {utilities.map((item) => (
          <button
            key={item.title}
            onClick={() => (item.route ? navigate(item.route) : setShowOverlay(true))}
            className="min-w-[180px] rounded-2xl bg-card border border-border p-4 text-left flex-shrink-0 active:scale-[0.97] transition-transform"
          >
            <div
              className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-2`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {item.title}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
              {item.desc}
            </p>
          </button>
        ))}
      </div>

      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowOverlay(false)}>
          <div className="bg-card border border-border rounded-2xl p-8 mx-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-cairo text-foreground">قريباً!</h3>
            <p className="text-sm text-muted-foreground mt-2">Coming Soon — This utility is under development.</p>
            <button onClick={() => setShowOverlay(false)} className="mt-5 px-6 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform">
              Got it!
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default UtilityScroll;
