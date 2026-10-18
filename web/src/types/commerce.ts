export type CommerceOrderStatus =
  | 'pending_admin_review'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type CommercePaymentStatus = 'pending_review' | 'paid' | 'failed' | 'refunded';
export type CommercePaymentMethod = 'manual' | 'cod' | 'online';

export interface CommerceInventory {
  productId: string;
  availableQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  updatedAt: string;
}

export interface CommerceProduct {
  id: string;
  sku: string | null;
  productName: string;
  slug: string;
  description: string | null;
  priceInr: number;
  comparePriceInr: number | null;
  imageUrl: string;
  badge: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  inventory: CommerceInventory;
}

export interface CommerceOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateCommerceOrderInput {
  businessId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  items: CommerceOrderItemInput[];
  paymentMethod?: CommercePaymentMethod;
  idempotencyKey?: string;
  notes?: string;
}

export interface CommerceOrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  skuSnapshot: string | null;
  productNameSnapshot: string;
  descriptionSnapshot: string | null;
  imageUrlSnapshot: string | null;
  quantity: number;
  unitPriceInr: number;
  lineTotalInr: number;
  createdAt: string;
}

export interface CommerceOrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus: CommerceOrderStatus | null;
  newStatus: CommerceOrderStatus;
  notes: string | null;
  updatedByAdmin: string | null;
  createdAt: string;
}

export interface CommerceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  businessId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  subtotalInr: number;
  totalAmountInr: number;
  paymentMethod: CommercePaymentMethod;
  paymentStatus: CommercePaymentStatus;
  status: CommerceOrderStatus;
  idempotencyKey: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: CommerceOrderItem[];
  statusHistory: CommerceOrderStatusHistory[];
}

export interface AdminCommerceProductInput {
  productName: string;
  slug?: string;
  sku?: string | null;
  description?: string | null;
  priceInr: number;
  comparePriceInr?: number | null;
  imageUrl: string;
  badge?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  availableQty?: number;
  lowStockThreshold?: number;
}
