export const SUDANESE_LOADING = [
  "جاري الكرب... الباقة غالية والسرعة سلحفاة 🐢",
  "صبراً يا زول... المعالج بياكل فول 🫘",
  "ثانية واحدة... ود الحلال بيشتغل 💪",
  "خليك معانا... النت سوداني 📶",
  "لسة شوية... الكهرباء جات 💡",
];

export const pickSudaneseMessage = () =>
  SUDANESE_LOADING[Math.floor(Math.random() * SUDANESE_LOADING.length)];
