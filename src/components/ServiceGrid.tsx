import { ImagePlus, Heart, Mic2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

const ServiceGrid = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const [showOverlay, setShowOverlay] = useState(false);

  // Brand category titles always remain in Arabic
  const services = [
    {
      titleAr: "ستوديو زول",
      desc: t("svc.studio.desc", language),
      icon: ImagePlus,
      iconBg: "bg-gold/20",
      route: "/studio",
    },
    {
      titleAr: "مصمم حالات",
      desc: t("svc.wajib.desc", language),
      icon: Heart,
      iconBg: "bg-nile/20",
      route: "/al-wajib",
    },
    {
      titleAr: "المسجل الذكي",
      desc: t("svc.recorder.desc", language),
      icon: Mic2,
      iconBg: "bg-earth/20",
      route: null,
    },
    {
      titleAr: "زول شير",
      desc: t("svc.share.desc", language),
      icon: Share2,
      iconBg: "bg-sand-dark/20",
      route: "/zool-share",
    },
  ];

  return (
    <section className="px-5 mt-6">
      <h3 className="text-base font-semibold text-foreground mb-3">
        {t("section.services", language)}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service.titleAr}
            onClick={() => service.route ? navigate(service.route) : setShowOverlay(true)}
            className="rounded-2xl bg-card border border-border p-4 text-start active:scale-[0.97] transition-transform hover:glow-gold"
          >
            <div
              className={`w-11 h-11 rounded-xl ${service.iconBg} flex items-center justify-center mb-3`}
            >
              <service.icon className="w-5 h-5 text-foreground" />
            </div>
            <p className="text-sm font-bold font-cairo text-foreground" dir="rtl">
              {service.titleAr}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {service.desc}
            </p>
          </button>
        ))}
      </div>

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
    </section>
  );
};

export default ServiceGrid;
