import { ImagePlus, Heart, Mic2, Share2 } from "lucide-react";

const services = [
  {
    title: "Zool Studio",
    titleAr: "ستوديو زول",
    desc: "AI Image Processing",
    icon: ImagePlus,
    gradient: "from-gold to-gold-glow",
    iconBg: "bg-gold/20",
  },
  {
    title: "Al-Wajib",
    titleAr: "الواجب",
    desc: "Templates & Greetings",
    icon: Heart,
    gradient: "from-nile to-nile-light",
    iconBg: "bg-nile/20",
  },
  {
    title: "Smart Recorder",
    titleAr: "المسجل الذكي",
    desc: "Record & Voice Changer",
    icon: Mic2,
    gradient: "from-earth-light to-earth",
    iconBg: "bg-earth/20",
  },
  {
    title: "Zool Share",
    titleAr: "زول شير",
    desc: "File Sharing & PDF Scan",
    icon: Share2,
    gradient: "from-sand-dark to-sand",
    iconBg: "bg-sand-dark/20",
  },
];

const ServiceGrid = () => {
  return (
    <section className="px-5 mt-6">
      <h3 className="text-base font-semibold text-foreground mb-3">
        Services
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service.title}
            className="rounded-2xl bg-card border border-border p-4 text-left active:scale-[0.97] transition-transform hover:glow-gold"
          >
            <div
              className={`w-11 h-11 rounded-xl ${service.iconBg} flex items-center justify-center mb-3`}
            >
              <service.icon className="w-5 h-5 text-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {service.title}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {service.desc}
            </p>
            <p className="text-[11px] font-cairo text-earth-light mt-1" dir="rtl">
              {service.titleAr}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ServiceGrid;
