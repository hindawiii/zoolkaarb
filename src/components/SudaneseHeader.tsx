import { useMemo } from "react";
import { useUser } from "@/store/userStore";
import { t } from "@/lib/i18n";

const SudaneseHeader = () => {
  const { name, language } = useUser();

  const greetingKey = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "greeting.morning";
    if (hour >= 12 && hour < 17) return "greeting.afternoon";
    if (hour >= 17 && hour < 21) return "greeting.evening";
    return "greeting.night";
  }, []);

  const arGreeting = `${t(greetingKey, "ar")}، ${name}`;
  const enGreeting = `${t(greetingKey, "en")}, ${name}`;

  return (
    <header className="px-5 pt-6 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground tracking-tight">
            ZoolKaarb
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language === "en" ? enGreeting : enGreeting}
          </p>
        </div>
        <p className="text-lg font-cairo text-earth-light" dir="rtl">
          {arGreeting}
        </p>
      </div>
    </header>
  );
};

export default SudaneseHeader;
