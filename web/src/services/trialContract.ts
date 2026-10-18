import { PLATFORM_CONFIG } from '../config/env.ts';

export const TRIAL_DURATION_HOURS = PLATFORM_CONFIG.trialDurationHours;
export const TRIAL_DURATION_MS = TRIAL_DURATION_HOURS * 60 * 60 * 1000;

export type TrialWindow = {
  startedAt: string;
  expiresAt: string;
};

/**
 * The business row and the trials row must share one start/expiry window.
 * Keeping the calculation here prevents browser and server provisioning from
 * drifting to different trial semantics.
 */
export function getTrialWindow(startedAt = new Date()): TrialWindow {
  return {
    startedAt: startedAt.toISOString(),
    expiresAt: new Date(startedAt.getTime() + TRIAL_DURATION_MS).toISOString(),
  };
}
