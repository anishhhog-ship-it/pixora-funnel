import { API_URL } from './config';
import type { StoreOrderInput, StoreProduct } from './types';

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
  businesses: Record<string, unknown>[];
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

export interface StoreOrderResponse {
  success: true;
  order: {
    id: string;
    orderNumber?: string | null;
    status?: string | null;
    totalAmount?: number | null;
  };
  nextStep?: string;
}

export interface StoreCatalogResponse {
  success: true;
  products: StoreProduct[];
}

export interface StoreOrdersResponse {
  success: true;
  orders: (StoreOrderResponse['order'] & {
    createdAt?: string;
    paymentStatus?: string;
  })[];
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

export function createStoreOrder(accessToken: string, input: StoreOrderInput): Promise<StoreOrderResponse> {
  // Use the same server-authoritative commerce contract as the web dashboard.
  // Prices, product identity, stock, and order status are never trusted from
  // the mobile client.
  return request<StoreOrderResponse>('/api/commerce/orders', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      businessId: input.businessId,
      customerName: input.customer.name,
      customerEmail: input.customer.email,
      customerPhone: input.customer.phone,
      shippingAddress: input.shippingAddress.address,
      city: input.shippingAddress.city,
      state: input.shippingAddress.state,
      postalCode: input.shippingAddress.pincode,
      country: input.shippingAddress.country,
      items: input.items,
      paymentMethod: 'manual',
      idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      notes: input.notes || undefined,
    }),
  });
}

export function getStoreCatalog(accessToken: string): Promise<StoreCatalogResponse> {
  return request<{ success: true; products: {
    id: string;
    slug: string;
    productName: string;
    description: string | null;
    priceInr: number;
    comparePriceInr: number | null;
    imageUrl: string | null;
    badge: string | null;
    inventory: { availableQty: number };
  }[] }>('/api/commerce/catalog', accessToken).then((payload) => ({
    success: true,
    products: payload.products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.productName,
      description: product.description,
      priceInr: product.priceInr,
      comparePriceInr: product.comparePriceInr,
      imageUrl: product.imageUrl,
      badge: product.badge,
      availableQty: product.inventory?.availableQty ?? 0,
    })),
  }));
}

export function getStoreOrders(accessToken: string): Promise<StoreOrdersResponse> {
  return request<{ success: true; orders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmountInr: number;
    createdAt: string;
    paymentStatus: string;
  }[] }>('/api/commerce/orders', accessToken).then((payload) => ({
    success: true,
    orders: payload.orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmountInr,
      createdAt: order.createdAt,
      paymentStatus: order.paymentStatus,
    })),
  }));
}
