import assert from 'node:assert/strict';
import {
  isBusinessAccessExpired,
  isPaidBusiness,
  resolveBusinessPlanStatus,
} from '../src/services/businessAccess.ts';
import { getSalesDemoVisibilityFilter } from '../src/services/salesDemoVisibility.ts';

const now = Date.parse('2026-10-16T12:00:00.000Z');
const yesterday = '2026-10-15T12:00:00.000Z';
const tomorrow = '2026-10-17T12:00:00.000Z';

assert.equal(
  resolveBusinessPlanStatus({ plan_status: 'trial', status: 'active', trial_expires_at: yesterday }, now),
  'expired',
  'an active row with an expired trial remains expired when plan_status is trial',
);
assert.equal(
  resolveBusinessPlanStatus({ plan_status: 'active', status: 'trial', trial_expires_at: yesterday }, now),
  'active',
  'paid plan_status takes precedence over trial/status fields',
);
assert.equal(
  isBusinessAccessExpired({ plan_status: 'trial', status: 'trial', trial_expires_at: tomorrow }, tomorrow, now),
  false,
  'a future trial remains accessible while its demo is also live',
);
assert.equal(
  resolveBusinessPlanStatus({ plan_status: 'trial', status: 'trial', trial_expires_at: tomorrow }, now),
  'trial',
  'a future trial resolves to trial rather than active',
);
assert.equal(
  isBusinessAccessExpired({ plan_status: 'trial', status: 'trial', trial_expires_at: tomorrow }, yesterday, now),
  true,
  'an expired demo locks an otherwise-live unpaid trial',
);
assert.equal(
  isBusinessAccessExpired({ plan_status: 'active', status: 'active', trial_expires_at: yesterday }, yesterday, now),
  false,
  'paid lifetime access remains available after demo/trial timestamps pass',
);
assert.equal(
  isBusinessAccessExpired({ plan_status: 'trial', status: 'trial', trial_expires_at: tomorrow }, yesterday, now + 2 * 24 * 60 * 60 * 1000),
  true,
  'a demo expiry locks an unpaid account once its timestamp has passed',
);
assert.equal(
  isBusinessAccessExpired({ plan_status: 'trial', status: 'trial', trial_expires_at: 'not-a-timestamp' }, null, now),
  true,
  'an unpaid account with an invalid expiry timestamp fails closed',
);
assert.equal(
  resolveBusinessPlanStatus({ plan_status: 'unknown', status: 'active' }, now),
  'expired',
  'an unknown explicit plan status does not inherit paid access from a legacy active status',
);
assert.equal(isPaidBusiness({ status: 'active' }, now), true, 'legacy active rows remain readable');
assert.equal(
  getSalesDemoVisibilityFilter('staff-a', ['prospect-a', 'prospect-b']),
  'created_by.eq.staff-a,prospect_id.in.(prospect-a,prospect-b)',
  'salesperson visibility includes creator and assigned prospects',
);

console.log('Demo access and sales visibility checks passed.');
