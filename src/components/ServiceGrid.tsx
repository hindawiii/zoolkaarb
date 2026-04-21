import {
  ImagePlus,
  Heart,
  Wand2,
  Share2,
  Mic,
  PhoneCall,
  PhoneIncoming,
  Music2,
  Sparkles,
  Database,
  ScanLine,
  FileText,
  FileType2,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useUser } from "@/store/userStore";

type Tile = {
  titleAr: string;
  titleEn: string;
  desc: string;
  icon: typeof ImagePlus;
  iconBg: string;
  route?: string;
  comingSoon?: boolean;
};

type Hub = {
  titleAr: string;
  titleEn: string;
  accent: string; // gradient class for header pill
  tiles: Tile[];
};

const ServiceGrid = () => {
  const navigate = useNavigate();
  const { language } = useUser();
  const isRtl = language === "ar";
  const [showOverlay, setShowOverlay] = useState(false);

  const hubs: Hub[] = [
    {
      titleAr: "استوديو الذكاء الاصطناعي",
      titleEn: "AI Studio",
      accent: "gradient-gold",
      tiles: [
        {
          titleAr: "ستوديو زول",
          titleEn: "Zool Studio",
          desc: isRtl ? "6 أدوات ذكاء اصطناعي" : "6 AI image tools",
          icon: ImagePlus,
          iconBg: "bg-gold/20",
          route: "/studio",
        },
        {
          titleAr: "مصمم حالات",
          titleEn: "Status Maker",
          desc: isRtl ? "حالات وقوالب جاهزة" : "Ready-made status templates",
          icon: Heart,
          iconBg: "bg-nile/20",
          route: "/al-wajib",
        },
      ],
    },
    {
      titleAr: "استوديو الصوتيات",
      titleEn: "Audio Studio",
      accent: "gradient-nile",
      tiles: [
        {
          titleAr: "غيّر صوتك",
          titleEn: "Voice Changer",
          desc: isRtl ? "مقلب الصوت بشخصيات سودانية" : "Sudanese voice changer",
          icon: Wand2,
          iconBg: "bg-earth/20",
          route: "/voice-changer",
        },
        {
          titleAr: "مفكرة الخال",
          titleEn: "Smart Notes",
          desc: isRtl ? "ملاحظات صوتية ذكية" : "Smart voice notes",
          icon: Mic,
          iconBg: "bg-nile/20",
          // Voice notes are accessed via the floating button, but expose a tile too.
          route: undefined,
          comingSoon: false,
        },
        {
          titleAr: "استوديو زول الكارب",
          titleEn: "Audio Studio",
          desc: isRtl ? "مصنع ميديا + بصمة + ريمكس" : "Media · Voice-over · Remix",
          icon: Music2,
          iconBg: "bg-gold/20",
          route: "/audio-studio",
        },
        {
          titleAr: "ريمكس الخال",
          titleEn: "Al-Khal Remix",
          desc: isRtl ? "مكتبة مقدمات سودانية" : "Sudanese intros library",
          icon: Sparkles,
          iconBg: "bg-earth/20",
          route: "/audio-studio/remix",
        },
      ],
    },
    {
      titleAr: "قسم الفزعة",
      titleEn: "Zool Tools",
      accent: "bg-gradient-to-r from-earth to-earth-light",
      tiles: [
        {
          titleAr: "فزعة الخال",
          titleEn: "Fake Call",
          desc: isRtl ? "مكالمة وهمية واقعية" : "Realistic fake call",
          icon: PhoneCall,
          iconBg: "bg-gold/20",
          route: "/fake-call",
        },
        {
          titleAr: "كاشف الأرقام",
          titleEn: "Caller ID",
          desc: isRtl ? "قريباً: تحديد المتصل" : "Soon: Caller lookup",
          icon: PhoneIncoming,
          iconBg: "bg-nile/20",
          comingSoon: true,
        },
        {
          titleAr: "زول شير",
          titleEn: "Zool Share",
          desc: isRtl ? "مشاركة بدون نت" : "Offline file share",
          icon: Share2,
          iconBg: "bg-sand-dark/20",
          route: "/zool-share",
        },
        {
          titleAr: "موفر البيانات",
          titleEn: "Data Saver",
          desc: isRtl ? "ضغط الميديا" : "Compress media",
          icon: Database,
          iconBg: "bg-nile/20",
          route: "/data-saver",
        },
      ],
    },
    {
      titleAr: "المكتب الرقمي",
      titleEn: "Digital Office",
      accent: "bg-gradient-to-r from-gold to-gold-glow",
      tiles: [
        {
          titleAr: "ماسح المستندات",
          titleEn: "Doc Scanner",
          desc: isRtl ? "صور المستند PDF" : "Capture as PDF",
          icon: ScanLine,
          iconBg: "bg-gold/20",
          route: "/scanner",
        },
        {
          titleAr: "صور / نص → PDF",
          titleEn: "Image / Text → PDF",
          desc: isRtl ? "اجمع صور أو نص" : "Merge to PDF",
          icon: FileText,
          iconBg: "bg-nile/20",
          route: "/office/to-pdf",
        },
        {
          titleAr: "PDF ↔ Word",
          titleEn: "PDF ↔ Word",
          desc: isRtl ? "بدعم العربي" : "Arabic OCR",
          icon: FileType2,
          iconBg: "bg-earth/20",
          route: "/office/converter",
        },
        {
          titleAr: "كل المكتب",
          titleEn: "All Office Tools",
          desc: isRtl ? "ادخل المكتب" : "Open the office",
          icon: Briefcase,
          iconBg: "bg-gold/20",
          route: "/office",
        },
      ],
    },
  ];

  const onTile = (t: Tile) => {
    if (t.comingSoon || !t.route) {
      setShowOverlay(true);
      return;
    }
    navigate(t.route);
  };

  return (
    <section className="px-5 mt-6 space-y-7">
      {hubs.map((hub) => (
        <div key={hub.titleAr}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-block w-1.5 h-5 rounded-full ${hub.accent}`} />
            <h3 className="text-base font-bold font-cairo text-foreground" dir="rtl">
              {isRtl ? hub.titleAr : hub.titleEn}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {hub.tiles.map((tile) => (
              <button
                key={tile.titleAr}
                onClick={() => onTile(tile)}
                className="relative rounded-2xl bg-card border border-border p-4 text-start active:scale-[0.97] transition-transform hover:glow-gold overflow-hidden"
              >
                {tile.comingSoon && (
                  <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-cairo">
                    {isRtl ? "قريباً" : "Soon"}
                  </span>
                )}
                <div
                  className={`w-11 h-11 rounded-xl ${tile.iconBg} flex items-center justify-center mb-3`}
                >
                  <tile.icon className="w-5 h-5 text-foreground" />
                </div>
                <p className="text-sm font-bold font-cairo text-foreground" dir="rtl">
                  {isRtl ? tile.titleAr : tile.titleEn}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 font-cairo">
                  {tile.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}

      {showOverlay && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-8 mx-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold font-cairo text-foreground">
              {isRtl ? "قريباً يا هندسة!" : "Coming soon!"}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 font-cairo">
              {isRtl ? "الخال شغال على الميزة دي.. صبراً جميلاً" : "Al-Khal is cooking this up..."}
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="mt-5 px-6 py-2.5 rounded-full gradient-gold text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
            >
              {isRtl ? "تمام" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default ServiceGrid;
