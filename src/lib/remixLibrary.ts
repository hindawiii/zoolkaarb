// Pre-defined Sudanese intros / outros used by ريمكس الخال.
// Phase 1: spoken via SpeechSynthesis (browser TTS) so we don't need to ship
// audio files. Each clip carries a duration estimate used to lay it out on
// the timeline. Future iterations can swap `text` for a real `audioUrl`.

export type RemixClip = {
  id: string;
  labelAr: string;
  text: string;          // Arabic line spoken by TTS
  kind: "intro" | "outro" | "tag";
  approxSec: number;     // approximate spoken length
  emoji: string;
};

export const REMIX_LIBRARY: RemixClip[] = [
  { id: "intro-salam", labelAr: "السلام عليكم يا هندسة", text: "السلام عليكم يا هندسة، الخال معاكم!", kind: "intro", approxSec: 3, emoji: "👋" },
  { id: "intro-karib", labelAr: "كارب يا زول", text: "كارب يا زول، شد حيلك!", kind: "intro", approxSec: 2, emoji: "🔥" },
  { id: "intro-fazaa", labelAr: "فزعة الخال", text: "فزعة الخال جات ليك!", kind: "intro", approxSec: 2, emoji: "📣" },
  { id: "tag-tasha", labelAr: "تشاااا", text: "تشااااا!", kind: "tag", approxSec: 1, emoji: "💥" },
  { id: "tag-ya-zol", labelAr: "يا زووول", text: "يا زووووول!", kind: "tag", approxSec: 1, emoji: "🎤" },
  { id: "outro-shukran", labelAr: "شكراً وما تنسى الاشتراك", text: "شكراً ليكم وما تنسوا الاشتراك يا هندسة!", kind: "outro", approxSec: 4, emoji: "🙏" },
  { id: "outro-afeet", labelAr: "عفيت منك", text: "عفيت منك يا هندسة!", kind: "outro", approxSec: 2, emoji: "✌️" },
];

export const getRemixById = (id: string) => REMIX_LIBRARY.find((c) => c.id === id);
