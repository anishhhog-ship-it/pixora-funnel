import { salesDb } from './salesServer';
import { isAllowedGoogleMapsUrl, isAllowedGoogleReviewUrl } from './salesValidation';

const PRODUCTMATE_ENDPOINT = 'https://productmate.com/api/v1/google-review-link';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 15;
const REQUEST_WINDOW_MS = 60 * 1000;
const TIMEOUT_MS = Number(process.env.PRODUCTMATE_TIMEOUT_MS || 10_000);

export interface GoogleReviewLinkResult {
  placeId: string;
  reviewUrl: string;
  verification: 'not_verified';
  source: 'saved' | 'cache' | 'productmate';
}

type CacheEntry = GoogleReviewLinkResult & { expiresAt: number };
type RateBucket = { startedAt: number; count: number };

const state = globalThis as typeof globalThis & {
  __pixoraReviewLinkCache?: Map<string, CacheEntry>;
  __pixoraReviewLinkInflight?: Map<string, Promise<GoogleReviewLinkResult>>;
  __pixoraReviewLinkRate?: Map<string, RateBucket>;
};

const cache = state.__pixoraReviewLinkCache ?? (state.__pixoraReviewLinkCache = new Map());
const inflight = state.__pixoraReviewLinkInflight ?? (state.__pixoraReviewLinkInflight = new Map());
const rate = state.__pixoraReviewLinkRate ?? (state.__pixoraReviewLinkRate = new Map());

export class GoogleReviewLinkError extends Error {
  status: number;
  code: string;
  retryAfter?: number;

  constructor(message: string, status: number, code: string, retryAfter?: number) {
    super(message);
    this.name = 'GoogleReviewLinkError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

function normalizedMapsUrl(value: string) {
  const url = new URL(value.trim());
  url.hash = '';
  return url.toString();
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const current = rate.get(ip);
  if (!current || now - current.startedAt >= REQUEST_WINDOW_MS) {
    rate.set(ip, { startedAt: now, count: 1 });
    return;
  }
  if (current.count >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.max(60, Math.ceil((REQUEST_WINDOW_MS - (now - current.startedAt)) / 1000));
    throw new GoogleReviewLinkError('Review-link generation is busy. Please wait before trying again.', 429, 'rate_limited', retryAfter);
  }
  current.count += 1;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new GoogleReviewLinkError('Productmate timed out. Try the full Google Maps URL or use the manual review URL.', 504, 'upstream_timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function parseProductmateResponse(payload: unknown): { placeId: string; reviewUrl: string } {
  const value = payload as Record<string, unknown>;
  const placeId = typeof value?.place_id === 'string' ? value.place_id.trim() : '';
  const reviewUrl = typeof value?.review_url === 'string' ? value.review_url.trim() : '';
  if (!placeId || !isAllowedGoogleReviewUrl(reviewUrl)) {
    throw new GoogleReviewLinkError('Productmate returned an invalid review link. Nothing was saved.', 502, 'malformed_response');
  }
  return { placeId, reviewUrl };
}

async function fetchFromProductmate(mapsUrl: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 400));
    try {
      const response = await withTimeout(fetch(PRODUCTMATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ maps_url: mapsUrl }),
        cache: 'no-store',
      }), TIMEOUT_MS);

      if (response.status === 429) {
        throw new GoogleReviewLinkError('Productmate is rate limiting requests. Please wait at least 60 seconds before retrying.', 429, 'upstream_rate_limited', 60);
      }
      if (response.status >= 400 && response.status < 500) {
        const code = response.status === 422 ? 'unsupported_url' : 'invalid_request';
        throw new GoogleReviewLinkError(response.status === 422
          ? 'That link is not a specific Google Maps business. Copy the exact business Share link.'
          : 'Productmate could not read that Google Maps link.', response.status, code);
      }
      if (!response.ok) {
        lastError = new GoogleReviewLinkError('Productmate is temporarily unavailable. Try again or use the full Maps URL.', 503, 'upstream_unavailable');
        continue;
      }
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new GoogleReviewLinkError('Productmate returned an invalid response. Nothing was saved.', 502, 'malformed_response');
      }
      return parseProductmateResponse(payload);
    } catch (error) {
      if (error instanceof GoogleReviewLinkError && error.status !== 503 && !(error.status === 504 && attempt === 0)) throw error;
      lastError = error;
    }
  }
  if (lastError instanceof GoogleReviewLinkError) throw lastError;
  throw new GoogleReviewLinkError('Could not reach Productmate. Check your connection or use the manual review URL.', 503, 'network_error');
}

async function findSavedLink(mapsUrl: string, prospectId?: string | null) {
  const db = salesDb();
  const businessIds: string[] = [];
  if (prospectId) {
    const { data } = await db.from('prospects').select('converted_business_id').eq('id', prospectId).maybeSingle();
    if (data?.converted_business_id) businessIds.push(data.converted_business_id);
    const { data: demo } = await db.from('sales_demos').select('business_id').eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (demo?.business_id) businessIds.push(demo.business_id);
  }

  let query = db.from('businesses').select('id, google_place_id, google_review_url, google_maps_url');
  query = businessIds.length ? query.in('id', [...new Set(businessIds)]) : query.eq('google_maps_url', mapsUrl);
  const { data, error } = await query.limit(10);
  if (error) return null;
  const saved = (data || []).find((candidate: { google_review_url?: unknown; google_place_id?: unknown }) => candidate?.google_review_url && isAllowedGoogleReviewUrl(candidate.google_review_url));
  if (!saved) return null;
  return {
    placeId: typeof saved.google_place_id === 'string' ? saved.google_place_id : '',
    reviewUrl: saved.google_review_url,
  };
}

export async function generateGoogleReviewLink(options: { mapsUrl: string; ip: string; prospectId?: string | null }): Promise<GoogleReviewLinkResult> {
  if (!isAllowedGoogleMapsUrl(options.mapsUrl)) {
    throw new GoogleReviewLinkError('Paste a full Google Maps business Share link, maps.app.goo.gl link, or goo.gl/maps link.', 400, 'invalid_maps_url');
  }
  const mapsUrl = normalizedMapsUrl(options.mapsUrl);
  const saved = await findSavedLink(mapsUrl, options.prospectId);
  if (saved) {
    return { ...saved, verification: 'not_verified', source: 'saved' };
  }

  const cached = cache.get(mapsUrl);
  if (cached && cached.expiresAt > Date.now()) return { ...cached, source: 'cache' };
  cache.delete(mapsUrl);

  const existing = inflight.get(mapsUrl);
  if (existing) return { ...(await existing), source: 'cache' };

  checkRateLimit(options.ip);
  const request = fetchFromProductmate(mapsUrl).then(({ placeId, reviewUrl }) => {
    const result = { placeId, reviewUrl, verification: 'not_verified' as const, source: 'productmate' as const };
    cache.set(mapsUrl, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }).finally(() => inflight.delete(mapsUrl));
  inflight.set(mapsUrl, request);
  return request;
}
