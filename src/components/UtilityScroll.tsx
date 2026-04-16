import { MapPin, FileDown, Gift } from "lucide-react";

const utilities = [
  {
    title: "Al-Zool Yafatish",
    titleAr: "الزول يفتش",
    desc: "Find pharmacies, hospitals & restaurants",
    icon: MapPin,
    color: "text-nile",
    bg: "bg-nile-light",
  },
  {
    title: "Data Saver",
    titleAr: "موفر البيانات",
    desc: "Compress images & files",
    icon: FileDown,
    color: "text-gold",
    bg: "bg-gold/10",
  },
  {
    title: "Rewarded Ads",
    titleAr: "إعلانات مكافأة",
    desc: "Unlock premium templates",
    icon: Gift,
    color: "text-earth-light",
    bg: "bg-sand",
  },
];

const UtilityScroll = () => {
  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold text-foreground px-5 mb-3">
        Utilities
      </h3>
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
        {utilities.map((item) => (
          <button
            key={item.title}
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
    </section>
  );
};

export default UtilityScroll;
