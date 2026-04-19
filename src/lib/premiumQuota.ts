// Lightweight quota tracker for premium font/effect usage in the
// Text-on-Image / Status Maker editor. Independent of the Studio quota.

const KEY = "zoolkaarb-premium-text-quota-v1";
export const FREE_LIMIT = 3;
export const AD_REWARD = 3;

const read = (): number => {
  if (typeof window === "undefined") return FREE_LIMIT;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      localStorage.setItem(KEY, String(FREE_LIMIT));
      return FREE_LIMIT;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : FREE_LIMIT;
  } catch {
    return FREE_LIMIT;
  }
};

const write = (n: number) => {
  try {
    localStorage.setItem(KEY, String(Math.max(0, n)));
  } catch {
    /* ignore */
  }
};

export const getPremiumRemaining = (): number => read();

export const consumePremiumUse = (): number => {
  const next = Math.max(0, read() - 1);
  write(next);
  return next;
};

export const grantPremiumReward = (): number => {
  const next = read() + AD_REWARD;
  write(next);
  return next;
};
