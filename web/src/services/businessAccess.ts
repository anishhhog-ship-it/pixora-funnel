import type { Business } from '@/types';

export type BusinessEntitlementRow = {
  status?: string | null;
  plan_status?: string | null;
  trial_expires_at?: string | null;
};

export type BusinessPlanStatus = NonNullable<Business['planStatus']>;

function isExpiredAt(expiresAt: string | null | undefined, now = Date.now()): boolean {
  if (!expiresAt) return false;
  const expiresAtMs = new Date(expiresAt).getTime();
  // An unpaid account with an unusable expiry timestamp cannot be proven to be
  // active. Treat malformed timestamps as expired so access fails closed.
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= now;
}

/**
 * Resolve the customer-facing entitlement from the canonical business fields.
 * plan_status is authoritative when present; status is only a legacy fallback
 * for rows created before plan_status was introduced.
 */
export function resolveBusinessPlanStatus(
  row: BusinessEntitlementRow,
  now = Date.now(),
): BusinessPlanStatus {
  const planStatus = row.plan_status?.trim().toLowerCase();

  if (planStatus === 'active') return 'active';
  if (planStatus === 'expired') return 'expired';
  if (planStatus === 'trial') {
    return isExpiredAt(row.trial_expires_at, now) ? 'expired' : 'trial';
  }
  if (planStatus) return 'expired';

  // Legacy rows may have only businesses.status. Do not let an explicit
  // plan_status of trial be upgraded by status='active'.
  if (row.status?.trim().toLowerCase() === 'active') return 'active';
  return isExpiredAt(row.trial_expires_at, now) ? 'expired' : 'trial';
}

export function isPaidBusiness(
  row: BusinessEntitlementRow,
  now = Date.now(),
): boolean {
  const planStatus = row.plan_status?.trim().toLowerCase();
  if (planStatus) return planStatus === 'active';
  return resolveBusinessPlanStatus(row, now) === 'active';
}

export function isBusinessAccessExpired(
  row: BusinessEntitlementRow,
  demoExpiresAt?: string | null,
  now = Date.now(),
): boolean {
  if (isPaidBusiness(row, now)) return false;

  return (
    resolveBusinessPlanStatus(row, now) === 'expired' ||
    isExpiredAt(row.trial_expires_at, now) ||
    isExpiredAt(demoExpiresAt, now)
  );
}
