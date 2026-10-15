/** Pure request validation used by sales route handlers. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= max ? text : null;
}

export function isHttpsUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https:\/\//i.test(value);
}

const GOOGLE_MAPS_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl',
]);

/**
 * Productmate only accepts a business-specific Google Maps URL. Keep this
 * deliberately strict so arbitrary redirects and local/internal URLs never
 * reach the upstream service.
 */
export function isAllowedGoogleMapsUrl(value: unknown): value is string {
  if (!isHttpsUrl(value)) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!GOOGLE_MAPS_HOSTS.has(host) || url.username || url.password) return false;
    if (host === 'maps.app.goo.gl') return url.pathname.length > 1;
    if (host === 'goo.gl') return url.pathname.toLowerCase().startsWith('/maps/');
    return /(^|\/)maps(\/|$)/i.test(url.pathname) && url.pathname.length > 5;
  } catch {
    return false;
  }
}

/** Direct Google review-writing URLs suitable for the manual fallback. */
export function isAllowedGoogleReviewUrl(value: unknown): value is string {
  if (!isHttpsUrl(value)) return false;
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'search.google.com') return url.pathname === '/local/writereview' && Boolean(url.searchParams.get('placeid'));
    if (host === 'www.google.com' || host === 'google.com' || host === 'maps.google.com') {
      return /(^|\/)maps(\/|$)/i.test(url.pathname) && Boolean(url.searchParams.get('placeid'));
    }
    return false;
  } catch {
    return false;
  }
}

/** Review destinations already supported by older demos. */
export function isAllowedReviewDestinationUrl(value: unknown): value is string {
  return isAllowedGoogleReviewUrl(value) || isAllowedGoogleMapsUrl(value);
}
