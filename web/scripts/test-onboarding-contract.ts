import assert from 'node:assert/strict';
import { getCanonicalOnboardingHref } from '../src/app/onboarding/legacyStepRedirect.ts';
import { normalizeBusinessCategory } from '../src/config/businessCategories.ts';
import { getTrialWindow, TRIAL_DURATION_MS } from '../src/services/trialContract.ts';

const startedAt = new Date('2026-10-16T12:00:00.000Z');
const trial = getTrialWindow(startedAt);

assert.equal(
  Date.parse(trial.expiresAt) - Date.parse(trial.startedAt),
  TRIAL_DURATION_MS,
  'the web onboarding contract uses one 24-hour trial window',
);
assert.equal(
  getCanonicalOnboardingHref({ category: 'salon', step: 'customize' }),
  '/onboarding?category=salon&step=customize',
  'legacy onboarding step links preserve deep-link context on the canonical route',
);
assert.equal(
  normalizeBusinessCategory('restaurant').id,
  'restaurant',
  'industry category links resolve to the canonical category config',
);

console.log('Onboarding contract checks passed.');
