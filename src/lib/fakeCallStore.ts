// In-memory store for the currently scheduled / live fake call.
// Persists the active call config in sessionStorage so a navigation
// from the setup page → incoming page survives a route change but
// not a full app close (intentional — these are simulated calls only).

export type FakeCallStyle = "ios" | "android";
export type FakeCallAvatar = "gold" | "nile" | "earth" | "sand";

export interface FakeCallConfig {
  callerName: string;
  callerLabel: string; // e.g. "جوال" / "Mobile"
  avatar: FakeCallAvatar;
  style: FakeCallStyle;
  voiceLine: string;
  autoRedial: boolean;
  redialAfterSec: number; // seconds before re-ringing on decline
  scheduledAt: number; // epoch ms when the call should ring
}

const KEY = "zoolkaarb-fake-call-active";

export const saveFakeCall = (cfg: FakeCallConfig) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
};

export const loadFakeCall = (): FakeCallConfig | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FakeCallConfig) : null;
  } catch {
    return null;
  }
};

export const clearFakeCall = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

export const AVATAR_GRADIENT: Record<FakeCallAvatar, string> = {
  gold: "bg-gradient-to-br from-[hsl(42_85%_60%)] to-[hsl(35_70%_40%)]",
  nile: "bg-gradient-to-br from-[hsl(150_45%_55%)] to-[hsl(150_35%_30%)]",
  earth: "bg-gradient-to-br from-[hsl(25_45%_45%)] to-[hsl(25_35%_25%)]",
  sand: "bg-gradient-to-br from-[hsl(38_55%_75%)] to-[hsl(35_40%_50%)]",
};

// 5 preset Sudanese phrases the user can pick from. Played via Web Speech API.
export const VOICE_LINES_AR = [
  "ألو يا هندسة، وينك يا زول؟ كنت محتاجك ضروري والله!",
  "السلام عليكم.. الخال معاك، عندي ليك خبر بسيط لو ما مشغول.",
  "يا زول طوالي تعال البيت، الناس مستنياك.",
  "أخوك، الله يعافيك تعال للقهوة دي ضروري.",
  "يا حبيب الخال، الفزعة محتاجاك دلوقتي!",
];
