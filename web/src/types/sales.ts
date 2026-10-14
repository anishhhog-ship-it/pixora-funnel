export type SalesRole = 'salesperson' | 'sales_manager' | 'admin';
export type SalesStaffStatus = 'active' | 'invited' | 'deactivated';

export interface SalesStaff {
  id: string;
  auth_user_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  role: SalesRole;
  manager_id?: string | null;
  status: SalesStaffStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  last_active_at?: string | null;
}

export type ProspectStage =
  | 'New Lead'
  | 'Contacted'
  | 'Qualified'
  | 'Demo In Progress'
  | 'Demo Shared'
  | 'Follow-up'
  | 'Payment Pending'
  | 'Won'
  | 'Activated'
  | 'Lost';

export type LeadSource =
  | 'Meta Ads'
  | 'WhatsApp'
  | 'Field Sales'
  | 'Website'
  | 'Referrals'
  | 'Other';

export interface Prospect {
  id: string;
  business_name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  category: string;
  city?: string | null;
  address?: string | null;
  website?: string | null;
  google_maps_url?: string | null;
  lead_source: LeadSource;
  assigned_to?: string | null;
  stage: ProspectStage;
  notes?: string | null;
  next_followup_date?: string | null;
  last_contact_date?: string | null;
  is_converted: boolean;
  converted_business_id?: string | null;
  created_at: string;
  updated_at: string;
  assigned_staff?: Partial<SalesStaff> | null;
}

export interface SalesDemoConfig {
  headline?: string;
  subheadline?: string;
  minStarRatingForGoogle?: number;
  enableTopics?: boolean;
  topics?: string[];
  customGreeting?: string;
  showCategoryVisual?: boolean;
}

export interface SalesDemo {
  id: string;
  slug: string;
  prospect_id?: string | null;
  created_by?: string | null;
  business_name: string;
  category: string;
  review_destination_url: string;
  primary_color: string;
  logo_url?: string | null;
  cover_url?: string | null;
  template_slug: string;
  config: SalesDemoConfig;
  config_version: number;
  status: 'draft' | 'active' | 'shared' | 'converted' | 'revoked';
  shared_at?: string | null;
  expires_at?: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type SalesActivityType =
  | 'call'
  | 'visit'
  | 'whatsapp'
  | 'demo_created'
  | 'demo_shared'
  | 'note'
  | 'payment_pending'
  | 'converted'
  | 'stage_change'
  | 'task';

export interface SalesActivity {
  id: string;
  prospect_id: string;
  staff_id?: string | null;
  type: SalesActivityType;
  title: string;
  description?: string | null;
  due_date?: string | null;
  completed: boolean;
  completed_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CommercialPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price_paise: number;
  price_inr: number;
  billing_interval: '2_years' | 'lifetime' | 'yearly' | 'monthly';
  duration_years: number;
  is_lifetime: boolean;
  includes_nfc: boolean;
  max_slots?: number | null;
  slots_used: number;
  is_active: boolean;
  display_order: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'PENDING' | 'PENDING_APPROVAL' | 'VERIFIED' | 'FAILED' | 'CANCELLED';

export interface SalesOrder {
  id: string;
  order_no: string;
  prospect_id?: string | null;
  demo_id?: string | null;
  sales_staff_id?: string | null;
  customer_id?: string | null;
  business_id?: string | null;
  plan_slug: string;
  plan_snapshot: Record<string, any>;
  amount_paise: number;
  amount_inr: number;
  payment_method: 'UPI' | 'Bank Transfer' | 'Cash' | 'Online Gateway';
  transaction_reference?: string | null;
  payment_status: PaymentStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  conversion_status: 'pending' | 'converted' | 'failed';
  converted_at?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
}

export type NfcOrderStatus = 'Ordered' | 'In Production' | 'Dispatched' | 'Delivered' | 'Cancelled';

export interface NfcOrder {
  id: string;
  sales_order_id: string;
  business_id?: string | null;
  recipient_name: string;
  shipping_address: string;
  city: string;
  state: string;
  pincode: string;
  contact_phone: string;
  nfc_asset_type: 'Card' | 'Stand' | 'Card + Stand' | 'Tag';
  status: NfcOrderStatus;
  courier_name?: string | null;
  tracking_number?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesDashboardMetrics {
  totalProspects: number;
  newLeads: number;
  qualifiedLeads: number;
  demosCreated: number;
  demosShared: number;
  followupsDueToday: number;
  overdueFollowups: number;
  paymentPendingOrders: number;
  verifiedPayments: number;
  wonDeals: number;
  activatedCustomers: number;
  actualRevenueCollectedPaise: number;
  actualRevenueCollectedInr: number;
  nfcPendingFulfillment: number;
  lifetimeSlotsUsed: number;
  lifetimeSlotsMax: number;
  lifetimeSlotsRemaining: number;
  leadSourceBreakdown: Record<LeadSource, number>;
  stagePipeline: Record<ProspectStage, number>;
}

export interface CustomerHandoverPackage {
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessSlug: string;
  loginUrl: string;
  publicFunnelUrl: string;
  qrCodeDownloadUrl: string;
  planName: string;
  isLifetime: boolean;
  expiresAt?: string | null;
  nfcOrdered: boolean;
  nfcAssetType?: string;
  whatsappMessageTemplate: string;
  activationStatus?: 'pending_payment' | 'active';
  paymentStatus?: PaymentStatus;
  orderNo?: string;
}
