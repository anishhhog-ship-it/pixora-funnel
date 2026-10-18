'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Check,
  Edit3,
  Package,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { CommerceProduct } from '@/types/commerce';

type ProductForm = {
  productName: string;
  slug: string;
  description: string;
  priceInr: string;
  comparePriceInr: string;
  imageUrl: string;
  badge: string;
  sortOrder: string;
  isActive: boolean;
  stock: string;
  lowStockThreshold: string;
};

const EMPTY_FORM: ProductForm = {
  productName: '',
  slug: '',
  description: '',
  priceInr: '',
  comparePriceInr: '',
  imageUrl: '',
  badge: '',
  sortOrder: '1',
  isActive: true,
  stock: '0',
  lowStockThreshold: '5',
};

function formForProduct(product: CommerceProduct): ProductForm {
  return {
    productName: product.productName,
    slug: product.slug,
    description: product.description || '',
    priceInr: String(product.priceInr),
    comparePriceInr: product.comparePriceInr === null ? '' : String(product.comparePriceInr),
    imageUrl: product.imageUrl,
    badge: product.badge || '',
    sortOrder: String(product.sortOrder),
    isActive: product.isActive,
    stock: String(product.inventory.availableQty),
    lowStockThreshold: String(product.inventory.lowStockThreshold),
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [inventoryTrackingAvailable, setInventoryTrackingAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<CommerceProduct | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      const response = await fetch('/api/admin/commerce/products', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json() as { success?: boolean; products?: CommerceProduct[]; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load the product catalog.');
      setProducts(result.products || []);
      setInventoryTrackingAvailable(true);
    } catch (err) {
      setInventoryTrackingAvailable(false);
      setError(err instanceof Error ? err.message : 'Unable to load the product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => `${product.productName} ${product.slug} ${product.badge}`.toLowerCase().includes(query));
  }, [products, search]);

  const lowStockProducts = products.filter((product) => product.inventory.isLowStock);
  const activeProducts = products.filter((product) => product.isActive);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setIsEditorOpen(true);
    setError('');
    setMessage('');
  };

  const openEdit = (product: CommerceProduct) => {
    setEditingProduct(product);
    setForm(formForProduct(product));
    setIsEditorOpen(true);
    setError('');
    setMessage('');
  };

  const closeEditor = () => {
    if (saving) return;
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setIsEditorOpen(false);
  };

  const updateField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      const priceInr = Number(form.priceInr);
      const comparePriceInr = form.comparePriceInr.trim() ? Number(form.comparePriceInr) : null;
      if (!form.productName.trim()) throw new Error('Product name is required.');
      if (!Number.isFinite(priceInr) || priceInr < 0) throw new Error('Enter a valid non-negative price.');
      if (comparePriceInr !== null && (!Number.isFinite(comparePriceInr) || comparePriceInr < 0)) throw new Error('Enter a valid compare-at price.');

      const commonInput = {
        productName: form.productName,
        slug: form.slug.trim() || undefined,
        description: form.description,
        priceInr,
        comparePriceInr,
        imageUrl: form.imageUrl.trim() || '/products/placeholder.jpg',
        badge: form.badge,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 1,
      };
      const availableQty = Number(form.stock);
      const lowStockThreshold = Number(form.lowStockThreshold);
      if (!Number.isInteger(availableQty) || availableQty < 0) throw new Error('Stock must be a whole number greater than or equal to zero.');
      if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) throw new Error('Low-stock threshold must be a whole number greater than or equal to zero.');
      let saved: CommerceProduct;
      if (editingProduct) {
        const response = await fetch(`/api/admin/commerce/products?productId=${encodeURIComponent(editingProduct.id)}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
          ...commonInput,
          availableQty,
          lowStockThreshold,
          }),
        });
        const result = await response.json() as { success?: boolean; product?: CommerceProduct; error?: string };
        if (!response.ok || !result.success || !result.product) throw new Error(result.error || 'Unable to save product.');
        saved = result.product;
        setProducts((current) => current.map((product) => product.id === saved.id ? saved : product));
        setMessage('Product changes saved.');
      } else {
        const response = await fetch('/api/admin/commerce/products', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...commonInput, availableQty, lowStockThreshold }),
        });
        const result = await response.json() as { success?: boolean; product?: CommerceProduct; error?: string };
        if (!response.ok || !result.success || !result.product) throw new Error(result.error || 'Unable to create product.');
        saved = result.product;
        setProducts((current) => [...current, saved].sort((a, b) => a.sortOrder - b.sortOrder));
        setMessage('Product created in the catalog.');
      }
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: CommerceProduct) => {
    setSavingProductId(product.id);
    setError('');
    setMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      const response = await fetch(`/api/admin/commerce/products?productId=${encodeURIComponent(product.id)}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const result = await response.json() as { success?: boolean; product?: CommerceProduct; error?: string };
      if (!response.ok || !result.success || !result.product) throw new Error(result.error || 'Unable to update product status.');
      const updated = result.product;
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`${updated.productName} is now ${updated.isActive ? 'active' : 'inactive'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update product status.');
    } finally {
      setSavingProductId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
            <Package className="h-3.5 w-3.5" /> Commerce catalog
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Products &amp; Inventory</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-500">Monitor the physical product catalog, pricing, active visibility, and stock signals used by commerce orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add product
          </button>
        </div>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span></div>}
      {message && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><Check className="mt-0.5 h-4 w-4 shrink-0" /> <span>{message}</span></div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Catalog products" value={products.length} />
        <Metric label="Active products" value={activeProducts.length} tone="emerald" />
        <Metric label="Low stock / out" value={lowStockProducts.length} tone={lowStockProducts.length ? 'amber' : 'slate'} />
        <Metric label="Inventory tracking" value={inventoryTrackingAvailable ? 'Available' : error ? 'Unavailable' : 'Checking…'} tone={inventoryTrackingAvailable ? 'blue' : error ? 'rose' : 'slate'} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Catalog inventory list</h2>
            <p className="mt-1 text-xs text-slate-500">Low-stock signals use each product&apos;s configured inventory threshold.</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loading ? <div className="flex min-h-[280px] items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-blue-600" /></div> : (
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-white text-[11px] uppercase tracking-wider text-slate-400">
                <tr><th className="px-5 py-4">Product</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Updated</th><th className="px-5 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const lowStock = product.inventory.isLowStock;
                  const outOfStock = product.inventory.availableQty <= 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">{product.imageUrl ? <Image src={product.imageUrl} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" /> : <Package className="h-5 w-5" />}</div><div className="min-w-0"><div className="truncate font-semibold text-slate-900">{product.productName}</div><div className="truncate text-xs text-slate-500">{product.slug}{product.badge ? ` · ${product.badge}` : ''}</div></div></div></td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{product.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-5 py-4"><div><span className={`font-bold ${outOfStock ? 'text-rose-700' : lowStock ? 'text-amber-700' : 'text-slate-800'}`}>{product.inventory.availableQty} units</span>{outOfStock && <span className="ml-2 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">Out of stock</span>}{!outOfStock && lowStock && <span className="ml-2 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Low stock</span>}</div><div className="text-[10px] text-slate-400">Alert at {product.inventory.lowStockThreshold}</div></td>
                      <td className="px-5 py-4"><div className="font-bold text-slate-900">₹{product.priceInr.toLocaleString('en-IN')}</div>{product.comparePriceInr !== null && <div className="text-xs text-slate-400 line-through">₹{product.comparePriceInr.toLocaleString('en-IN')}</div>}</td>
                      <td className="px-5 py-4 text-xs text-slate-500">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-5 py-4"><div className="flex items-center justify-end gap-2"><button type="button" onClick={() => void toggleActive(product)} disabled={savingProductId === product.id} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50" title={product.isActive ? 'Deactivate product' : 'Activate product'}>{product.isActive ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5" />}</button><button type="button" onClick={() => openEdit(product)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Edit3 className="h-3.5 w-3.5" /> Edit</button></div></td>
                    </tr>
                  );
                })}
                {!loading && filteredProducts.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-slate-500">{products.length ? 'No products match this search.' : 'No product catalog records are available.'}</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label={editingProduct ? 'Edit product' : 'Create product'}>
          <form onSubmit={saveProduct} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">{editingProduct ? 'Edit product' : 'Add product'}</h2><p className="mt-1 text-xs text-slate-500">Changes are written through the verified admin service.</p></div><button type="button" onClick={closeEditor} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X className="h-5 w-5" /></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Product name" value={form.productName} onChange={(value) => updateField('productName', value)} required />
              <Field label="Slug" value={form.slug} onChange={(value) => updateField('slug', value)} placeholder="Generated from name when blank" />
              <Field label="Price (INR)" type="number" min="0" step="0.01" value={form.priceInr} onChange={(value) => updateField('priceInr', value)} required />
              <Field label="Compare-at price (INR)" type="number" min="0" step="0.01" value={form.comparePriceInr} onChange={(value) => updateField('comparePriceInr', value)} />
              <Field label="Image URL" value={form.imageUrl} onChange={(value) => updateField('imageUrl', value)} placeholder="Optional; placeholder used when blank" />
              <Field label="Badge" value={form.badge} onChange={(value) => updateField('badge', value)} placeholder="Popular, Best Value…" />
              <Field label="Sort order" type="number" min="0" step="1" value={form.sortOrder} onChange={(value) => updateField('sortOrder', value)} />
              <Field label="Available stock" type="number" min="0" step="1" value={form.stock} onChange={(value) => updateField('stock', value)} />
              <Field label="Low-stock threshold" type="number" min="0" step="1" value={form.lowStockThreshold} onChange={(value) => updateField('lowStockThreshold', value)} />
              <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /> Visible in active catalog</label>
              <label className="sm:col-span-2"><span className="text-sm font-semibold text-slate-700">Description</span><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={closeEditor} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving && <RefreshCw className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : editingProduct ? 'Save changes' : 'Create product'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone = 'blue' }: { label: string; value: number | string; tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const colors = { blue: 'text-blue-700 bg-blue-50', emerald: 'text-emerald-700 bg-emerald-50', amber: 'text-amber-700 bg-amber-50', rose: 'text-rose-700 bg-rose-50', slate: 'text-slate-700 bg-slate-100' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div><div className={`mt-3 inline-flex rounded-xl px-3 py-1.5 text-xl font-bold ${colors[tone]}`}>{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</div></div>;
}

function Field({ label, value, onChange, type = 'text', min, step, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; placeholder?: string; required?: boolean }) {
  return <label className="block"><span className="text-sm font-semibold text-slate-700">{label}</span><input type={type} min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>;
}
