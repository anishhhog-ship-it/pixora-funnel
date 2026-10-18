'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { HARDWARE_PRODUCTS, type HardwareProduct } from '@/config/products';
import { authService, businessService } from '@/services';
import { Business } from '@/types';
import type { CommerceProduct, CommerceOrder } from '@/types/commerce';
import { cn } from '@/lib/utils';
import {
  PORTAL_FOCUS_RING,
  PortalCard,
  PortalEmptyState,
  PortalErrorState,
  PortalLoadingState,
  PortalPageHeader,
} from '@/components/client-portal/PortalUI';

type Cart = Record<string, number>;

type StoreProduct = CommerceProduct & {
  tagline: string;
  image: string;
  formattedPrice: string;
  formattedOriginalPrice: string;
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  customizationNotes: string;
};

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  customizationNotes: '',
};

function money(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

const CONFIG_BY_SLUG: Record<string, HardwareProduct> = {
  'nfc-card': HARDWARE_PRODUCTS[0],
  'table-stand-5': HARDWARE_PRODUCTS[1],
  'nfc-qr-combo': HARDWARE_PRODUCTS[2],
  'multi-table-pack': HARDWARE_PRODUCTS[3],
};

function isUsableImage(value: string | null | undefined) {
  return Boolean(value && value.startsWith('/'));
}

function presentProduct(product: CommerceProduct): StoreProduct {
  const configured = CONFIG_BY_SLUG[product.slug];
  return {
    ...product,
    tagline: configured?.tagline || product.description || 'Branded Pixora hardware for your customer funnel',
    image: isUsableImage(product.imageUrl) ? product.imageUrl : configured?.image || '/products/nfc-review-card.jpg',
    formattedPrice: money(product.priceInr),
    formattedOriginalPrice: product.comparePriceInr ? money(product.comparePriceInr) : '',
  };
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('delivered')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (normalized.includes('dispatch')) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (normalized.includes('cancel')) return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function orderStatusLabel(status: string) {
  return status === 'pending_admin_review' ? 'Pending admin review' : status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function paymentStatusLabel(status: string) {
  if (status === 'paid') return 'Payment verified';
  if (status === 'failed') return 'Payment failed — contact support';
  if (status === 'refunded') return 'Payment refunded';
  return 'Payment pending review';
}

function ProductCard({ product, quantity, onChange }: { product: StoreProduct; quantity: number; onChange: (quantity: number) => void }) {
  return (
    <PortalCard className="flex h-full flex-col overflow-hidden">
      <div className="relative flex h-44 items-center justify-center bg-slate-100 p-4">
        <Image src={product.image} alt={product.productName} width={320} height={176} className="h-full w-full object-contain mix-blend-multiply" />
        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 shadow-sm">
          {product.inventory.availableQty > 0 ? (product.badge || 'Available') : 'Currently unavailable'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="text-base font-bold text-slate-950">{product.productName}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{product.tagline}</p>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-xl font-extrabold text-slate-950">{product.formattedPrice}</span>
          {product.formattedOriginalPrice && <span className="pb-0.5 text-xs font-medium text-slate-400 line-through">{product.formattedOriginalPrice}</span>}
        </div>
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{product.description || 'Branded hardware configured for your Pixora funnel.'}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button type="button" aria-label={`Decrease ${product.productName} quantity`} onClick={() => onChange(Math.max(0, quantity - 1))} className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900', PORTAL_FOCUS_RING)}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-8 text-center text-xs font-bold text-slate-900">{quantity}</span>
            <button type="button" disabled={product.inventory.availableQty <= 0} aria-label={`Increase ${product.productName} quantity`} onClick={() => onChange(Math.min(product.inventory.availableQty, quantity + 1))} className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35', PORTAL_FOCUS_RING)}>
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className={cn('text-[10px] font-semibold', product.inventory.availableQty > 0 ? 'text-slate-400' : 'text-rose-600')}>{product.inventory.availableQty > 0 ? `${product.inventory.availableQty} available` : 'Contact Pixora'}</span>
        </div>
      </div>
    </PortalCard>
  );
}

function OrderStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const Icon = normalized.includes('deliver') ? CheckCircle2 : normalized.includes('dispatch') ? Truck : Clock3;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold', statusTone(status))}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {orderStatusLabel(status)}
    </span>
  );
}

export default function StorePage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedCart, setExpandedCart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cartItems = useMemo(() => products
    .map((product) => ({ product, quantity: cart[product.id] || 0 }))
    .filter((item) => item.quantity > 0), [cart, products]);
  const total = cartItems.reduce((sum, item) => sum + item.product.priceInr * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const active = await businessService.getActiveBusiness();
        if (!mounted) return;
        setBusiness(active);
        if (active) {
          const session = await authService.getSession();
          if (!session?.access_token) {
            setError('Your secure session is unavailable. Sign in again to load order history.');
            return;
          }
          const [catalogResponse, ordersResponse] = await Promise.all([
            fetch('/api/commerce/catalog', { cache: 'no-store' }),
            fetch('/api/commerce/orders', {
              cache: 'no-store',
              headers: { Authorization: `Bearer ${session.access_token}` },
            }),
          ]);
          const catalogPayload = await catalogResponse.json();
          const ordersPayload = await ordersResponse.json();
          if (!catalogResponse.ok) throw new Error(catalogPayload.error || 'Product catalogue is temporarily unavailable.');
          if (!ordersResponse.ok) throw new Error(ordersPayload.error || 'Order history is temporarily unavailable.');
          if (!catalogPayload.products?.length) throw new Error('The Pixora hardware catalogue is not available yet. Please contact support.');
          if (mounted) {
            setProducts(catalogPayload.products.map((product: CommerceProduct) => presentProduct(product)));
            setOrders((ordersPayload.orders || []).filter((order: CommerceOrder) => !order.businessId || order.businessId === active.businessId));
            setForm((current) => ({
              ...current,
              fullName: current.fullName || active.ownerName || '',
              email: current.email || active.email || session.user.email || '',
              phone: current.phone || active.phone || '',
              address: current.address || active.address || '',
              city: current.city || active.city || '',
            }));
          }
        }
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Could not load the store.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!business || cartItems.length === 0) {
      setError('Choose at least one item before submitting your request.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const session = await authService.getSession();
      if (!session?.access_token) throw new Error('Your secure session has expired. Sign in again to submit this request.');
      const response = await fetch('/api/commerce/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          businessId: business.businessId,
          customerName: form.fullName,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: 'India',
          items: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          paymentMethod: 'manual',
          idempotencyKey: typeof crypto !== 'undefined' ? crypto.randomUUID() : undefined,
          notes: form.customizationNotes || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'We could not submit this request.');
      setOrders((current) => [payload.order, ...current]);
      setCart({});
      setSuccess(`${payload.order.orderNumber} submitted. ${payload.message} Pixora support will confirm availability and the next payment step.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not submit this request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PortalLoadingState label="Loading Pixora Store" />;
  if (!business) return <PortalErrorState title="Business profile required" description="Create or select a business profile before requesting Pixora hardware." />;

  return (
    <div className="space-y-6 pb-8">
      <PortalPageHeader
        eyebrow="Pixora Store"
        title="Order review hardware"
        description="Choose NFC cards, acrylic stands, or a bundle. We will confirm availability, customization and payment details before fulfilment."
        actions={<Link href="/dashboard/settings" className={cn('rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50', PORTAL_FOCUS_RING)}>Edit business profile</Link>}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-900" role="status">
        <Package className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
        <p><strong>Order requests are pending admin review.</strong> No payment is collected in this dashboard. Pixora support will confirm stock, artwork and the next payment step after submission.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <p>{success}</p>
        </div>
      )}

      <section aria-labelledby="catalog-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="catalog-title" className="text-base font-bold text-slate-950">Hardware catalogue</h2>
            <p className="mt-1 text-xs text-slate-500">Current catalogue items available to request.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">{products.length} items</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} quantity={cart[product.id] || 0} onChange={(quantity) => setCart((current) => ({ ...current, [product.id]: quantity }))} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <PortalCard className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">Shipping &amp; customization</h2>
              <p className="mt-1 text-xs text-slate-500">Tell us where to send your branded hardware.</p>
            </div>
            <ShoppingBag className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </div>
          <form onSubmit={submitOrder} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.fullName} onChange={(value) => updateForm('fullName', value)} required />
              <Field label="Email" type="email" value={form.email} onChange={(value) => updateForm('email', value)} required />
              <Field label="Phone / WhatsApp" value={form.phone} onChange={(value) => updateForm('phone', value)} required />
              <Field label="Postal code" value={form.postalCode} onChange={(value) => updateForm('postalCode', value)} required />
            </div>
            <Field label="Delivery address" value={form.address} onChange={(value) => updateForm('address', value)} required />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City" value={form.city} onChange={(value) => updateForm('city', value)} required />
              <Field label="State" value={form.state} onChange={(value) => updateForm('state', value)} required />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Customization notes <span className="font-normal text-slate-400">(optional)</span></span>
              <textarea value={form.customizationNotes} onChange={(event) => updateForm('customizationNotes', event.target.value)} rows={4} maxLength={1000} placeholder={`Logo, print text, table numbering, or other artwork notes for ${business.name}`} className={cn('w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500', PORTAL_FOCUS_RING)} />
            </label>
            <button type="submit" disabled={isSubmitting || itemCount === 0} className={cn('inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45', PORTAL_FOCUS_RING)}>
              <Package className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? 'Submitting request…' : itemCount > 0 ? `Submit order request · ${money(total)}` : 'Select an item to continue'}
            </button>
          </form>
        </PortalCard>

        <PortalCard className="h-fit overflow-hidden">
          <button type="button" onClick={() => setExpandedCart((current) => !current)} className={cn('flex w-full items-center justify-between gap-3 border-b border-slate-100 p-5 text-left', PORTAL_FOCUS_RING)} aria-expanded={expandedCart}>
            <span>
              <span className="flex items-center gap-2 text-base font-bold text-slate-950"><ShoppingBag className="h-4.5 w-4.5 text-blue-600" />Your request</span>
              <span className="mt-1 block text-xs text-slate-500">{itemCount} item{itemCount === 1 ? '' : 's'} selected</span>
            </span>
            {expandedCart ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {expandedCart && (
            <div className="p-5">
              {cartItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-500">Your request is empty. Add a catalogue item above.</p>
              ) : (
                <div className="space-y-3">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0"><p className="text-xs font-semibold text-slate-800">{product.productName}</p><p className="mt-0.5 text-[11px] text-slate-500">{quantity} × {product.formattedPrice}</p></div>
                      <span className="shrink-0 text-xs font-bold text-slate-900">{money(product.priceInr * quantity)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4"><span className="text-xs font-semibold text-slate-500">Estimated total</span><span className="text-lg font-extrabold text-slate-950">{money(total)}</span></div>
                  <p className="text-[10px] leading-relaxed text-slate-400">Final availability, shipping and payment details are confirmed by Pixora support after review.</p>
                </div>
              )}
            </div>
          )}
        </PortalCard>
      </div>

      <section aria-labelledby="orders-title">
        <div className="mb-3 flex items-center justify-between gap-3"><div><h2 id="orders-title" className="text-base font-bold text-slate-950">Your order requests</h2><p className="mt-1 text-xs text-slate-500">Track pending requests and fulfilment updates from Pixora.</p></div></div>
        {orders.length === 0 ? <PortalEmptyState icon={<Package className="h-6 w-6" />} title="No order requests yet" description="Your submitted hardware requests will appear here with their admin-review status." /> : (
          <div className="space-y-3">{orders.map((order) => (
            <PortalCard key={order.id} className="p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-slate-950">{order.orderNumber}</span><OrderStatus status={order.status} /></div><p className="mt-1 text-[11px] text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {order.items.map((item) => `${item.productNameSnapshot} × ${item.quantity}`).join(', ')}</p></div><div className="flex shrink-0 items-center justify-between gap-4 sm:block sm:text-right"><p className="text-base font-extrabold text-slate-950">{money(order.totalAmountInr)}</p><p className="mt-1 text-[10px] font-semibold text-amber-700">{paymentStatusLabel(order.paymentStatus)}</p></div></div></PortalCard>
          ))}</div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}{required && <span className="ml-1 text-rose-500">*</span>}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className={cn('w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500', PORTAL_FOCUS_RING)} /></label>
  );
}
