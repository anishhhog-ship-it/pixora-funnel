export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://funnel.pixoraautomations.com').replace(/\/$/, '');
export const PUBLIC_APP_URL = (process.env.EXPO_PUBLIC_PUBLIC_APP_URL || API_URL).replace(/\/$/, '');
export const SUPPORT_EMAIL = 'support@pixoraautomations.com';

export function getPublicFunnelUrl(slug: string | null | undefined): string | null {
  return slug ? `${PUBLIC_APP_URL}/f/${encodeURIComponent(slug)}` : null;
}
