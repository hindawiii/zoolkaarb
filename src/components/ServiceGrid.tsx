import { ImagePlus, Heart, Mic2, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const services = [
  {
    title: "Zool Studio",
    titleAr: "ستوديو زول",
    desc: "AI Image Processing",
    icon: ImagePlus,
    gradient: "from-gold to-gold-glow",
    iconBg: "bg-gold/20",
    route: "/studio",
  },
  {
    title: "Al-Wajib",
    titleAr: "الواجب",
    desc: "Templates & Greetings",
    icon: Heart,
    gradient: "from-nile to-nile-light",
    iconBg: "bg-nile/20",
    route: "/al-wajib",
  },
  {
    title: "Smart Recorder",
    titleAr: "المسجل الذكي",
    desc: "Record & Voice Changer",
    icon: Mic2,
    gradient: "from-earth-light to-earth",
    iconBg: "bg-earth/20",
    route: null,
  },
  {
    title: "Zool Share",
    titleAr: "زول شير",
    desc: "File Sharing & PDF Scan",
    icon: Share2,
    gradient: "from-sand-dark to-sand",
    iconBg: "bg-sand-dark/20",
    route: null,
  },
];

const ServiceGrid = () => {
  const navigate = useNavigate();
  const [showOverlay, setShowOverlay] = useState(false);

  return (
    <section className="px-5 mt-6">
      <h3 className="text-base font-semibold text-foreground mb-3">
        Services
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {services.map((service) => (
          <button
            key={service.title}
            onClick={() => service.route ? navigate(service.route) : setShowOverlay(true)}
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
