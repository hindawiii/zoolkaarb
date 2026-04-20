// Back-compat shim. The real ledger lives in `zoolCredits.ts`.
// Premium fonts/effects in TemplateEditor continue to work unchanged.

import {
  FREE_TRIAL,
  DEFAULT_REWARD,
  getCredits,
  consumeCredit,
  grantReward,
} from "./zoolCredits";

export const FREE_LIMIT = FREE_TRIAL;
export const AD_REWARD = DEFAULT_REWARD;

const TOOL = "premium-text";

export const getPremiumRemaining = (): number => getCredits(TOOL);
export const consumePremiumUse = (): number => consumeCredit(TOOL);
export const grantPremiumReward = (): number => grantReward(TOOL);
