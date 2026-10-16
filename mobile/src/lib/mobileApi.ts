import { API_URL } from './config';

export class MobileApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'MobileApiError';
    this.status = status;
  }
}

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    throw new MobileApiError(payload?.error || payload?.message || 'The Pixora service could not complete that request.', response.status);
  }

  return payload as T;
}

export interface MobileBusinessesResponse {
  success: true;
  businesses: Array<Record<string, unknown>>;
  activeSlug: string | null;
}

export interface GoogleSyncResponse {
  success: boolean;
  status: 'synced' | 'access_pending' | 'requires_auth' | 'api_error' | 'scheduled' | string;
  syncedCount?: number;
  totalReviewCount?: number;
  averageRating?: number;
  message?: string;
  googleConsoleUrl?: string;
}

export function getMobileBusinesses(accessToken: string): Promise<MobileBusinessesResponse> {
  return request<MobileBusinessesResponse>('/api/mobile/businesses', accessToken);
}

export function syncGoogleReviews(accessToken: string, businessId: string): Promise<GoogleSyncResponse> {
  return request<GoogleSyncResponse>('/api/google/reviews/sync', accessToken, {
    method: 'POST',
    body: JSON.stringify({ businessId, pageSize: 50 }),
  });
}
