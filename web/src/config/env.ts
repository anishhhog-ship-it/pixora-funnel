/**
 * PIXORA FUNNEL — PRODUCTION ENVIRONMENT & FEATURE CONFIGURATION
 *
 * Strict Production Gates:
 * - DEMO_MODE is strictly FALSE by default.
 * - In production, NO dummy or mock data will be rendered.
 * - Missing integrations are honestly presented as connection states, not faked.
 */

export const isDemoMode = (): boolean => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DEMO_MODE === 'true') {
      return true;
    }
  }
  return false; // Default: strictly FALSE for production
};

export const FEATURE_FLAGS = {
  // Google Business Profile review sync via official Google OAuth API
  GOOGLE_REVIEW_SYNC: process.env.NEXT_PUBLIC_ENABLE_GOOGLE_SYNC === 'true',
  // Live auto-reply posting to Google Business Profile API
  AUTO_REPLY: process.env.NEXT_PUBLIC_ENABLE_AUTO_REPLY === 'true',
  // Online automated payment gateway
  PAYMENTS: process.env.NEXT_PUBLIC_ENABLE_PAYMENTS === 'true',
  // Physical NFC & QR stand ordering system
  NFC_ORDERS: true,
  // Event stream telemetry analytics
  ADVANCED_ANALYTICS: true,
};

export const PLATFORM_CONFIG = {
  appName: 'Pixora Funnel',
  companyName: 'Pixora Automations',
  supportPhone: '+91 92573 78047',
  supportEmail: 'support@pixoraautomations.com',
  officialDomain: 'funnel.pixoraautomations.com',
  // Active Plans (1 Year Validity)
  planWithoutNfcPriceINR: 2599,
  planWithNfcPriceINR: 2999,
  lifetimePlanPriceINR: 2599,
  originalWithoutNfcPriceINR: 5999,
  originalWithNfcPriceINR: 6999,
  planValidity: '1 Year Only',
  trialDurationHours: 24,
};
