import { MapPin, FileDown, Gift, Share2, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

const UtilityScroll = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const [showOverlay, setShowOverlay] = useState(false);

  const utilities = [
    {
      title: t("util.dataSaver.title", language),
      titleAr: "موفّر البيانات",
      desc: t("util.dataSaver.desc", language),
      icon: FileDown,
      color: "text-gold",
      bg: "bg-gold/15",
      route: "/data-saver",
      span: "wide" as const,
    },
    {
      title: t("util.scanner.title", language),
      titleAr: "مسح المستندات",
      desc: t("util.scanner.desc", language),
      icon: ScanLine,
      color: "text-nile",
      bg: "bg-nile/15",
      route: "/scanner",
      span: "square" as const,
    },
    {
      title: t("util.yafatish.title", language),
      titleAr: "الزول يفتش",
      desc: t("util.yafatish.desc", language),
      icon: MapPin,
      color: "text-nile",
      bg: "bg-nile-light",
      route: "/yafatish",
      span: "square" as const,
    },
    {
      title: t("util.share.title", language),
      titleAr: "زول شير",
      desc: t("util.share.desc", language),
      icon: Share2,
      color: "text-sand-dark",
      bg: "bg-sand-dark/20",
      route: "/zool-share",
      span: "square" as const,
    },
    {
      title: t("util.rewards.title", language),
      titleAr: "إعلانات مكافأة",
      desc: t("util.rewards.desc", language),
      icon: Gift,
      color: "text-earth-light",
      bg: "bg-sand",
      route: null,
      span: "square" as const,
    },
  ];

  const baseCard =
    "rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-sm p-3 text-left active:scale-[0.97] transition-all hover:shadow-md hover:border-border";

  return (
    <section className="px-5 mt-6">
      <h3 className="text-base font-semibold text-foreground mb-3">
        {t("section.utilities", language)}
      </h3>

      <div className="grid grid-cols-2 gap-3 auto-rows-[110px]">
        {utilities.map((item) => {
          const isWide = item.span === "wide";
          return (
            <button
              key={item.title}
              onClick={() => (item.route ? navigate(item.route) : setShowOverlay(true))}
              className={`${baseCard} ${isWide ? "col-span-2 flex items-center gap-3" : "flex flex-col items-center justify-center text-center"}`}
            >
              <div
                className={`${isWide ? "w-11 h-11" : "w-10 h-10"} rounded-xl ${item.bg} flex items-center justify-center shrink-0 ${isWide ? "" : "mb-1.5"}`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className={isWide ? "flex-1 min-w-0" : ""}>
                <p className={`text-sm font-semibold text-foreground ${isWide ? "" : "leading-tight"}`}>
                  {item.title}
                </p>
                <p
                  className={`text-[11px] font-cairo text-muted-foreground mt-0.5 ${isWide ? "" : "line-clamp-1"}`}
                  dir="rtl"
                >
                  {item.titleAr}
                </p>
              </div>
            </button>
          );
        })}
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
