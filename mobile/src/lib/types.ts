export type GoogleConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'not_connected';

export interface MobileFunnel {
  id: string;
  business_id: string;
  slug: string;
  status: string;
  review_enabled: boolean;
  smart_review_enabled: boolean;
  menu_enabled: boolean;
  updated_at: string;
}

export interface MobileQrCode {
  id: string;
  business_id: string;
  funnel_id: string | null;
  name: string;
  short_code: string;
  destination_url: string;
  status: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  cta_text: string | null;
  updated_at: string;
}

export interface MobileGoogleConnection {
  id: string;
  business_id: string;
  provider: string;
  google_account_id: string | null;
  google_location_id: string | null;
  status: GoogleConnectionStatus;
  scopes: string[] | null;
  connected_at: string | null;
  last_synced_at: string | null;
  initial_sync_completed_at: string | null;
  next_sync_at: string | null;
  sync_error: string | null;
}

export interface MobileBusiness {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  status: string;
  owner_id: string | null;
  plan_status?: string | null;
  trial_expires_at?: string | null;
  google_place_id?: string | null;
  google_review_url?: string | null;
  google_maps_url?: string | null;
  membershipRole?: string | null;
  funnel: MobileFunnel | null;
  qrCode: MobileQrCode | null;
  googleConnection: MobileGoogleConnection | null;
}

export interface MobileReview {
  id: string;
  google_review_id: string;
  reviewer_name: string | null;
  reviewer_photo_url: string | null;
  rating: number;
  review_text: string | null;
  review_time: string;
  reply_status: 'unanswered' | 'replied' | 'draft' | string;
  reply_text: string | null;
  google_review_url: string | null;
  topics: string[] | null;
}

export interface MobileActivity {
  id: string;
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface MobileNfcOrder {
  id: string;
  status: string;
  nfc_asset_type?: string | null;
  card_type?: string | null;
  created_at: string;
  updated_at?: string | null;
  tracking_number?: string | null;
}

export interface StoreProduct {
  id: string;
  slug?: string | null;
  name: string;
  description: string | null;
  priceInr: number;
  comparePriceInr?: number | null;
  imageUrl?: string | null;
  badge?: string | null;
  availableQty: number;
}

export interface StoreOrderItemInput {
  productId: string;
  quantity: number;
}

export interface StoreOrderInput {
  businessId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: StoreOrderItemInput[];
  notes?: string;
}

export interface WorkspaceSnapshot {
  business: MobileBusiness;
  funnelUrl: string | null;
  reviews: MobileReview[];
  activities: MobileActivity[];
  nfcOrder: MobileNfcOrder | null;
  stats: {
    reviewCount: number;
    scanCount: number;
    repliedCount: number;
  };
  hasMoreReviews: boolean;
  reviewsError: string | null;
  dataSource: 'live' | 'unavailable';
}
