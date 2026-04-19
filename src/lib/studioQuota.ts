// Universal "3-Free" rewarded-ad quota system for AI Studio tools.
// Persists per-tool counters in localStorage. After FREE_LIMIT uses,
// the user must "watch a rewarded ad" (mock modal) to earn AD_REWARD more uses.

export const FREE_LIMIT = 3;
export const AD_REWARD = 3;

export type StudioToolId =
  | "living-image"
  | "face-swap"
  | "clothes-changer"
  | "anime-hero"
  | "smart-blender"
  | "challenge-arena";

const KEY = "zoolkaarb-studio-quota-v1";

type QuotaMap = Record<string, number>; // toolId -> remaining uses

const read = (): QuotaMap => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuotaMap) : {};
  } catch {
    return {};
  }
};

const write = (m: QuotaMap) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
};

export const getRemaining = (tool: StudioToolId): number => {
  const m = read();
  if (m[tool] === undefined) {
    m[tool] = FREE_LIMIT;
    write(m);
  }
  return m[tool];
};

export const consumeUse = (tool: StudioToolId): number => {
  const m = read();
  const current = m[tool] ?? FREE_LIMIT;
  const next = Math.max(0, current - 1);
  m[tool] = next;
  write(m);
  return next;
};

export const grantAdReward = (tool: StudioToolId): number => {
  const m = read();
  m[tool] = (m[tool] ?? 0) + AD_REWARD;
  write(m);
  return m[tool];
};

export const resetQuota = (tool: StudioToolId): void => {
  const m = read();
  m[tool] = FREE_LIMIT;
  write(m);
};
