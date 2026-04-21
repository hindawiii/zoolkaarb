// Random Sudanese sign-off phrases used by "بصمة الخال" toggle.
// Phase 1: text-only metadata (used as caption / TTS line). Future: real audio clips.

export const AL_KHAL_SIGNATURES_AR = [
  "عفيت منك يا هندسة!",
  "كارب يا زول.. كارب!",
  "الفزعة دي من الخال شخصياً 💪",
  "خليك على الخط يا حبيب!",
  "ده شغل سوداني أصيل 🇸🇩",
  "ما تنسى تشير الفيديو يا قمر!",
];

export const pickRandomSignature = () =>
  AL_KHAL_SIGNATURES_AR[Math.floor(Math.random() * AL_KHAL_SIGNATURES_AR.length)];
