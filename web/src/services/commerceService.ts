/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase commerce tables are additive until generated DB types are refreshed. */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { extractAuthToken } from '@/services/salesAuthService';
import { logAdminAction, verifyAdminAccess } from '@/services/adminService';
import type {
  AdminCommerceProductInput,
  CommerceInventory,
  CommerceOrder,
  CommerceOrderItem,
  CommerceOrderItemInput,
  CommerceOrderStatus,
  CommerceOrderStatusHistory,
  CommerceProduct,
  CreateCommerceOrderInput,
} from '@/types/commerce';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CommerceServiceError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'CommerceServiceError';
    this.status = status;
  }
}

export function commerceErrorResponse(error: unknown, fallback = 'Commerce service is temporarily unavailable') {
  if (error instanceof CommerceServiceError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  console.error('Commerce service error:', error);
  return NextResponse.json({ success: false, error: fallback }, { status: 503 });
}

export async function requireCommerceUser(req: NextRequest) {
  const token = extractAuthToken(req);
  if (!token) {
    return { response: NextResponse.json({ success: false, error: 'Authorization header required' }, { status: 401 }) };
  }

  const db = getSupabaseAdminClient() as any;
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) {
    return { response: NextResponse.json({ success: false, error: 'Invalid or expired user session' }, { status: 401 }) };
  }
  return { db, user: data.user, token };
}

async function requireCommerceAdmin(token: string) {
  if (!token) throw new CommerceServiceError('Authorization header required', 401);
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new CommerceServiceError('Unauthorized', 403);
  return { db: getSupabaseAdminClient() as any, session };
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integerValue(value: unknown, field: string, min: number, max: number) {
  const parsed = numberValue(value, Number.NaN);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new CommerceServiceError(`${field} must be an integer between ${min} and ${max}`, 400);
  }
  return parsed;
}

function textValue(value: unknown, field: string, min: number, max: number, required = true) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text && !required) return null;
  if (text.length < min || text.length > max) {
    throw new CommerceServiceError(`${field} must be between ${min} and ${max} characters`, 400);
  }
  return text;
}

function mapInventory(row: any, productId: string): CommerceInventory {
  const availableQty = Math.max(0, numberValue(row?.available_qty));
  const lowStockThreshold = Math.max(0, numberValue(row?.low_stock_threshold, 5));
  return {
    productId,
    availableQty,
    reservedQty: Math.max(0, numberValue(row?.reserved_qty)),
    lowStockThreshold,
    isLowStock: availableQty <= lowStockThreshold,
    updatedAt: row?.updated_at || new Date(0).toISOString(),
  };
}

function mapProduct(row: any, inventoryRow?: any): CommerceProduct {
  return {
    id: row.id,
    sku: row.sku || null,
    productName: row.product_name,
    slug: row.slug,
    description: row.description || null,
    priceInr: numberValue(row.price_inr),
    comparePriceInr: row.compare_price_inr == null ? null : numberValue(row.compare_price_inr),
    imageUrl: row.image_url,
    badge: row.badge || null,
    isActive: Boolean(row.is_active),
    sortOrder: numberValue(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    inventory: mapInventory(inventoryRow, row.id),
  };
}

function mapOrderItem(row: any): CommerceOrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id || null,
    skuSnapshot: row.sku_snapshot || null,
    productNameSnapshot: row.product_name_snapshot,
    descriptionSnapshot: row.description_snapshot || null,
    imageUrlSnapshot: row.image_url_snapshot || null,
    quantity: numberValue(row.quantity),
    unitPriceInr: numberValue(row.unit_price_inr),
    lineTotalInr: numberValue(row.line_total_inr),
    createdAt: row.created_at,
  };
}

function mapStatusHistory(row: any): CommerceOrderStatusHistory {
  return {
    id: row.id,
    orderId: row.order_id,
    previousStatus: row.previous_status || null,
    newStatus: row.new_status as CommerceOrderStatus,
    notes: row.notes || null,
    updatedByAdmin: row.updated_by_admin || null,
    createdAt: row.created_at,
  };
}

function mapOrder(row: any, items: any[] = [], history: any[] = []): CommerceOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    businessId: row.business_id || null,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    shippingAddress: row.shipping_address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    subtotalInr: numberValue(row.subtotal_inr),
    totalAmountInr: numberValue(row.total_amount_inr),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    idempotencyKey: row.idempotency_key || null,
    notes: row.notes || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map(mapOrderItem),
    statusHistory: history.map(mapStatusHistory),
  };
}

async function loadOrders(db: any, filters: { customerId?: string; status?: string } = {}): Promise<CommerceOrder[]> {
  let query = db.from('commerce_orders').select('*').order('created_at', { ascending: false });
  if (filters.customerId) query = query.eq('customer_id', filters.customerId);
  if (filters.status) query = query.eq('status', filters.status);
  const { data: orders, error } = await query;
  if (error) throw new CommerceServiceError('Commerce orders could not be loaded', 503);
  const rows = orders || [];
  if (!rows.length) return [] as CommerceOrder[];

  const ids = rows.map((row: any) => row.id);
  const [{ data: itemRows, error: itemError }, { data: historyRows, error: historyError }] = await Promise.all([
    db.from('commerce_order_items').select('*').in('order_id', ids).order('created_at', { ascending: true }),
    db.from('commerce_order_status_history').select('*').in('order_id', ids).order('created_at', { ascending: true }),
  ]);
  if (itemError || historyError) throw new CommerceServiceError('Commerce order details could not be loaded', 503);

  return rows.map((row: any) => mapOrder(
    row,
    (itemRows || []).filter((item: any) => item.order_id === row.id),
    (historyRows || []).filter((entry: any) => entry.order_id === row.id),
  ));
}

export async function getPublicCommerceCatalog() {
  const db = getSupabaseAdminClient() as any;
  const { data: products, error } = await db
    .from('product_catalog')
    .select('id,sku,product_name,slug,description,price_inr,compare_price_inr,image_url,badge,is_active,sort_order,created_at,updated_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new CommerceServiceError('Product catalog could not be loaded', 503);

  const ids = (products || []).map((product: any) => product.id);
  if (!ids.length) return [] as CommerceProduct[];
  const { data: inventory, error: inventoryError } = await db
    .from('product_inventory')
    .select('product_id,available_qty,low_stock_threshold,updated_at')
    .in('product_id', ids);
  if (inventoryError) throw new CommerceServiceError('Product inventory could not be loaded', 503);
  const inventoryMap = new Map((inventory || []).map((row: any) => [row.product_id, row]));
  return (products || []).map((product: any) => mapProduct(product, inventoryMap.get(product.id)));
}

function validateOrderInput(raw: unknown): CreateCommerceOrderInput {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rawItems = body.items;
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 50) {
    throw new CommerceServiceError('Order must contain between 1 and 50 items', 400);
  }
  const seen = new Set<string>();
  const items: CommerceOrderItemInput[] = rawItems.map((rawItem) => {
    const item = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>;
    const productId = textValue(item.productId, 'productId', 36, 36) || '';
    if (!UUID_REGEX.test(productId) || seen.has(productId)) {
      throw new CommerceServiceError('Each item must have a unique valid productId', 400);
    }
    seen.add(productId);
    return {
      productId,
      quantity: integerValue(item.quantity, 'quantity', 1, 99),
    };
  });

  const businessId = body.businessId == null || body.businessId === '' ? null : textValue(body.businessId, 'businessId', 36, 36);
  if (businessId && !UUID_REGEX.test(businessId)) throw new CommerceServiceError('businessId must be a valid UUID', 400);
  const paymentMethod = body.paymentMethod == null ? 'manual' : body.paymentMethod;
  if (paymentMethod !== 'manual' && paymentMethod !== 'cod' && paymentMethod !== 'online') {
    throw new CommerceServiceError('Unsupported payment method', 400);
  }
  const idempotencyKey = body.idempotencyKey == null ? undefined : textValue(body.idempotencyKey, 'idempotencyKey', 1, 128) || undefined;
  const notes = body.notes == null ? undefined : textValue(body.notes, 'notes', 1, 1000) || undefined;

  return {
    businessId,
    customerName: textValue(body.customerName, 'customerName', 1, 160) || '',
    customerEmail: (textValue(body.customerEmail, 'customerEmail', 3, 320) || '').toLowerCase(),
    customerPhone: textValue(body.customerPhone, 'customerPhone', 5, 40) || '',
    shippingAddress: textValue(body.shippingAddress, 'shippingAddress', 5, 1000) || '',
    city: textValue(body.city, 'city', 1, 120) || '',
    state: textValue(body.state, 'state', 1, 120) || '',
    postalCode: textValue(body.postalCode, 'postalCode', 3, 20) || '',
    country: body.country == null ? 'India' : textValue(body.country, 'country', 1, 80) || 'India',
    items,
    paymentMethod,
    idempotencyKey,
    notes,
  };
}

export async function createClientCommerceOrder(userId: string, rawInput: unknown) {
  if (!UUID_REGEX.test(userId)) throw new CommerceServiceError('Authenticated user identity is invalid', 401);
  const input = validateOrderInput(rawInput);
  const db = getSupabaseAdminClient() as any;
  if (input.businessId) {
    const { data: business, error: businessError } = await db
      .from('businesses')
      .select('id,owner_id')
      .eq('id', input.businessId)
      .maybeSingle();
    if (businessError) throw new CommerceServiceError('Business access could not be verified', 503);
    if (!business) throw new CommerceServiceError('Business was not found', 404);
    let allowed = business.owner_id === userId;
    if (!allowed) {
      const { data: profile } = await db.from('profiles').select('id').eq('auth_user_id', userId).maybeSingle();
      const ownerOrMemberIds = [userId, profile?.id].filter(Boolean);
      if (ownerOrMemberIds.length) {
        const { data: membership } = await db
          .from('business_members')
          .select('business_id')
          .eq('business_id', input.businessId)
          .in('user_id', ownerOrMemberIds);
        allowed = Boolean(membership?.length);
      }
    }
    if (!allowed) throw new CommerceServiceError('Customer is not a member of this business', 403);
  }
  const { data, error } = await db.rpc('create_commerce_order', {
    p_customer_id: userId,
    p_business_id: input.businessId,
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_shipping_address: input.shippingAddress,
    p_city: input.city,
    p_state: input.state,
    p_postal_code: input.postalCode,
    p_country: input.country,
    p_items: input.items,
    p_payment_method: input.paymentMethod,
    p_idempotency_key: input.idempotencyKey || null,
    p_notes: input.notes || null,
  });
  if (error) {
    const message = String(error.message || 'Order could not be created');
    if (/insufficient stock|unavailable|stock changed/i.test(message)) throw new CommerceServiceError(message, 409);
    if (/duplicate|between|details|required|unsupported|identity|business/i.test(message)) throw new CommerceServiceError(message, 400);
    if (error.code === '23505') throw new CommerceServiceError('An order with this idempotencyKey already exists', 409);
    throw new CommerceServiceError('Order could not be created', 503);
  }
  const created = Array.isArray(data) ? data[0] : data;
  if (!created?.id) throw new CommerceServiceError('Order creation returned no order', 503);
  const orders = await loadOrders(db, { customerId: userId });
  const order = orders.find((candidate) => candidate.id === created.id);
  if (!order) throw new CommerceServiceError('Order was created but could not be read back', 503);
  return order;
}

export async function getClientCommerceOrders(userId: string) {
  return loadOrders(getSupabaseAdminClient() as any, { customerId: userId });
}

function validateAdminProductInput(raw: unknown, partial = false): AdminCommerceProductInput {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const productName = body.productName == null && partial ? undefined : textValue(body.productName, 'productName', 1, 200);
  const imageUrl = body.imageUrl == null && partial ? undefined : textValue(body.imageUrl, 'imageUrl', 1, 2000);
  const priceInr = body.priceInr == null && partial ? undefined : numberValue(body.priceInr, Number.NaN);
  if (priceInr !== undefined && (!Number.isFinite(priceInr) || priceInr < 0)) throw new CommerceServiceError('priceInr must be a non-negative number', 400);
  const comparePriceInr = body.comparePriceInr == null && partial ? undefined : body.comparePriceInr == null ? null : numberValue(body.comparePriceInr, Number.NaN);
  if (comparePriceInr !== undefined && comparePriceInr !== null && (!Number.isFinite(comparePriceInr) || comparePriceInr < 0)) throw new CommerceServiceError('comparePriceInr must be non-negative', 400);
  const availableQty = body.availableQty == null && partial ? undefined : integerValue(body.availableQty ?? 0, 'availableQty', 0, 100000000);
  const lowStockThreshold = body.lowStockThreshold == null && partial ? undefined : integerValue(body.lowStockThreshold ?? 5, 'lowStockThreshold', 0, 100000000);
  const sortOrder = body.sortOrder == null && partial ? undefined : integerValue(body.sortOrder ?? 0, 'sortOrder', 0, 100000000);
  const slug = body.slug == null && partial ? undefined : textValue(body.slug, 'slug', 1, 160);
  const sku = body.sku == null && partial ? undefined : body.sku == null ? null : textValue(body.sku, 'sku', 1, 80, false);
  const description = body.description == null && partial ? undefined : body.description == null ? null : textValue(body.description, 'description', 1, 5000, false);
  const badge = body.badge == null && partial ? undefined : body.badge == null ? null : textValue(body.badge, 'badge', 1, 80, false);

  return {
    productName,
    slug,
    sku,
    description,
    priceInr,
    comparePriceInr,
    imageUrl,
    badge,
    isActive: body.isActive == null ? undefined : Boolean(body.isActive),
    sortOrder,
    availableQty,
    lowStockThreshold,
  } as AdminCommerceProductInput;
}

async function loadAdminProducts(db: any): Promise<CommerceProduct[]> {
  const { data: products, error } = await db
    .from('product_catalog')
    .select('id,sku,product_name,slug,description,price_inr,compare_price_inr,image_url,badge,is_active,sort_order,created_at,updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new CommerceServiceError('Admin product catalog could not be loaded', 503);
  const ids = (products || []).map((product: any) => product.id);
  if (!ids.length) return [] as CommerceProduct[];
  const { data: inventory, error: inventoryError } = await db.from('product_inventory').select('*').in('product_id', ids);
  if (inventoryError) throw new CommerceServiceError('Admin inventory could not be loaded', 503);
  const inventoryMap = new Map((inventory || []).map((row: any) => [row.product_id, row]));
  return (products || []).map((product: any) => mapProduct(product, inventoryMap.get(product.id)));
}

export async function getAdminCommerceProducts(token: string) {
  const { db } = await requireCommerceAdmin(token);
  return loadAdminProducts(db);
}

export async function createAdminCommerceProduct(token: string, rawInput: unknown) {
  const { db } = await requireCommerceAdmin(token);
  const input = validateAdminProductInput(rawInput);
  const slug = input.slug || (input.productName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 160);
  if (!slug) throw new CommerceServiceError('slug is required', 400);
  const { data: product, error } = await db.from('product_catalog').insert({
    product_name: input.productName,
    slug,
    sku: input.sku,
    description: input.description,
    price_inr: input.priceInr,
    compare_price_inr: input.comparePriceInr,
    image_url: input.imageUrl,
    badge: input.badge,
    is_active: input.isActive ?? true,
    sort_order: input.sortOrder ?? 0,
  }).select('*').single();
  if (error || !product) {
    if (error?.code === '23505') throw new CommerceServiceError('A product with this slug or SKU already exists', 409);
    throw new CommerceServiceError('Product could not be created', 503);
  }
  const { error: inventoryError } = await db.from('product_inventory').upsert({
    product_id: product.id,
    available_qty: input.availableQty ?? 0,
    low_stock_threshold: input.lowStockThreshold ?? 5,
  }, { onConflict: 'product_id' });
  if (inventoryError) {
    await db.from('product_catalog').delete().eq('id', product.id);
    throw new CommerceServiceError('Product inventory could not be created', 503);
  }
  const products = await loadAdminProducts(db);
  return products.find((candidate) => candidate.id === product.id) || mapProduct(product);
}

export async function updateAdminCommerceProduct(token: string, productId: string, rawInput: unknown) {
  const { db } = await requireCommerceAdmin(token);
  if (!UUID_REGEX.test(productId)) throw new CommerceServiceError('Valid product ID is required', 400);
  const input = validateAdminProductInput(rawInput, true);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.productName !== undefined) update.product_name = input.productName;
  if (input.slug !== undefined) update.slug = input.slug;
  if (input.sku !== undefined) update.sku = input.sku;
  if (input.description !== undefined) update.description = input.description;
  if (input.priceInr !== undefined) update.price_inr = input.priceInr;
  if (input.comparePriceInr !== undefined) update.compare_price_inr = input.comparePriceInr;
  if (input.imageUrl !== undefined) update.image_url = input.imageUrl;
  if (input.badge !== undefined) update.badge = input.badge;
  if (input.isActive !== undefined) update.is_active = input.isActive;
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  const { data: product, error } = await db.from('product_catalog').update(update).eq('id', productId).select('*').single();
  if (error || !product) {
    if (error?.code === '23505') throw new CommerceServiceError('A product with this slug or SKU already exists', 409);
    throw new CommerceServiceError('Product could not be updated', 503);
  }
  if (input.availableQty !== undefined || input.lowStockThreshold !== undefined) {
    const { data: current } = await db.from('product_inventory').select('available_qty,reserved_qty,low_stock_threshold').eq('product_id', productId).maybeSingle();
    if (input.availableQty !== undefined && input.availableQty < numberValue(current?.reserved_qty)) {
      throw new CommerceServiceError('Available stock cannot be below reserved stock', 409);
    }
    const { error: inventoryError } = await db.from('product_inventory').upsert({
      product_id: productId,
      available_qty: input.availableQty ?? numberValue(current?.available_qty),
      reserved_qty: numberValue(current?.reserved_qty),
      low_stock_threshold: input.lowStockThreshold ?? numberValue(current?.low_stock_threshold, 5),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'product_id' });
    if (inventoryError) throw new CommerceServiceError('Inventory could not be updated', 503);
  }
  const products = await loadAdminProducts(db);
  return products.find((candidate) => candidate.id === productId) || mapProduct(product);
}

export async function archiveAdminCommerceProduct(token: string, productId: string) {
  return updateAdminCommerceProduct(token, productId, { isActive: false });
}

export async function updateAdminCommerceInventory(token: string, productId: string, rawInput: unknown) {
  const { db } = await requireCommerceAdmin(token);
  if (!UUID_REGEX.test(productId)) throw new CommerceServiceError('Valid product ID is required', 400);
  const body = (rawInput && typeof rawInput === 'object' ? rawInput : {}) as Record<string, unknown>;
  const availableQty = integerValue(body.availableQty, 'availableQty', 0, 100000000);
  const lowStockThreshold = body.lowStockThreshold == null ? undefined : integerValue(body.lowStockThreshold, 'lowStockThreshold', 0, 100000000);
  const { data: current, error: currentError } = await db.from('product_inventory').select('reserved_qty,low_stock_threshold').eq('product_id', productId).maybeSingle();
  if (currentError || !current) throw new CommerceServiceError('Product inventory was not found', 404);
  if (availableQty < numberValue(current.reserved_qty)) throw new CommerceServiceError('Available stock cannot be below reserved stock', 409);
  const { error } = await db.from('product_inventory').update({
    available_qty: availableQty,
    low_stock_threshold: lowStockThreshold ?? numberValue(current.low_stock_threshold, 5),
    updated_at: new Date().toISOString(),
  }).eq('product_id', productId);
  if (error) throw new CommerceServiceError('Inventory could not be updated', 503);
  const products = await loadAdminProducts(db);
  return products.find((candidate) => candidate.id === productId);
}

export async function getAdminCommerceOrders(token: string, status?: string) {
  const { db } = await requireCommerceAdmin(token);
  if (status && !['pending_admin_review', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(status)) {
    throw new CommerceServiceError('Unsupported commerce order status', 400);
  }
  return loadOrders(db, { status });
}

export async function updateAdminCommerceOrderStatus(token: string, orderId: string, newStatus: CommerceOrderStatus, notes?: string) {
  const { db, session } = await requireCommerceAdmin(token);
  if (!UUID_REGEX.test(orderId)) throw new CommerceServiceError('Valid order ID is required', 400);
  if (!['pending_admin_review', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(newStatus)) {
    throw new CommerceServiceError('Unsupported commerce order status', 400);
  }
  const { data, error } = await db.rpc('update_commerce_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_admin_id: session.adminId || null,
    p_notes: notes || null,
  });
  if (error) {
    const message = String(error.message || 'Order status could not be updated');
    if (/not found|cannot be reopened|unsupported/i.test(message)) throw new CommerceServiceError(message, 409);
    throw new CommerceServiceError('Order status could not be updated', 503);
  }
  const updated = Array.isArray(data) ? data[0] : data;
  if (!updated?.id) throw new CommerceServiceError('Order status update returned no order', 503);
  try {
    await logAdminAction(token, 'COMMERCE_ORDER_STATUS_UPDATED', 'commerce_orders', orderId, `Status: ${newStatus}`);
  } catch {
    // The order transition is authoritative; an unavailable optional audit
    // sink must not turn a successful status transition into a false failure.
  }
  const orders = await loadOrders(db, {});
  const order = orders.find((candidate) => candidate.id === orderId);
  if (!order) throw new CommerceServiceError('Order status changed but could not be read back', 503);
  return order;
}
