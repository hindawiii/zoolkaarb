export const SUDANESE_LOADING = [
  "جاري الكرب... الباقة غالية والسرعة سلحفاة 🐢",
  "صبراً شوية... المعالج بياكل فول 🫘",
  "ثانية واحدة... الخال بيشتغل 💪",
  "خليك معانا... النت سوداني 📶",
  "لسة شوية... الكهرباء جات 💡",
];

export const pickSudaneseMessage = () =>
  SUDANESE_LOADING[Math.floor(Math.random() * SUDANESE_LOADING.length)];
