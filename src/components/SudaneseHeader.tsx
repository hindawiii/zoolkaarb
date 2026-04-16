import { useMemo } from "react";

const SudaneseHeader = () => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { ar: "صباح الخير يا زول ☀️", en: "Good Morning, Zool!" };
    } else if (hour >= 12 && hour < 17) {
      return { ar: "نهارك سعيد يا زول 🌤", en: "Good Afternoon, Zool!" };
    } else if (hour >= 17 && hour < 21) {
      return { ar: "مساء الخير يا زول 🌙", en: "Good Evening, Zool!" };
    } else {
      return { ar: "ليلة سعيدة يا زول ✨", en: "Good Night, Zool!" };
    }
  }, []);

  return (
    <header className="px-5 pt-6 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-cairo text-foreground tracking-tight">
            ZoolKaarb
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{greeting.en}</p>
        </div>
        <p className="text-lg font-cairo text-earth-light" dir="rtl">
          {greeting.ar}
        </p>
      </div>
    </header>
  );
};

export default SudaneseHeader;
