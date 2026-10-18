'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Download, Eye, Filter, Package, RefreshCw, Search, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { CommerceOrder, CommerceOrderStatus } from '@/types/commerce';

const STATUS_OPTIONS = [
  { key: 'pending_admin_review', label: 'Pending admin review' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
] as const;

function businessName(order: CommerceOrder) {
  return order.businessId || '—';
}

function statusClass(statusKey: string) {
  if (statusKey === 'delivered') return 'bg-emerald-50 text-emerald-700';
  if (statusKey === 'shipped') return 'bg-blue-50 text-blue-700';
  if (statusKey === 'cancelled' || statusKey === 'refunded') return 'bg-rose-50 text-rose-700';
  if (statusKey === 'processing' || statusKey === 'confirmed' || statusKey === 'pending_admin_review') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<CommerceOrder | null>(null);
  const [statusDraft, setStatusDraft] = useState<CommerceOrderStatus>('pending_admin_review');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      const response = await fetch('/api/admin/commerce/orders', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json() as { success?: boolean; orders?: CommerceOrder[]; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load commerce orders.');
      setOrders(result.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load commerce orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const query = search.trim().toLowerCase();
    const products = order.items.map((item) => item.productNameSnapshot).join(' ');
    const matchesSearch = !query || `${order.orderNumber} ${order.customerName} ${businessName(order)} ${order.status} ${products}`.toLowerCase().includes(query);
    return matchesSearch && (statusFilter === 'all' || order.status === statusFilter);
  }), [orders, search, statusFilter]);

  const exportOrders = () => {
    const csv = [['Order', 'Customer', 'Business ID', 'Products', 'Amount', 'Status', 'Date'], ...filteredOrders.map((order) => [order.orderNumber, order.customerName, businessName(order), order.items.map((item) => `${item.productNameSnapshot} × ${item.quantity}`).join(', '), order.totalAmountInr, order.status, order.createdAt])]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'orders.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openDetails = (order: CommerceOrder) => {
    setSelectedOrder(order);
    setStatusDraft(order.status);
    setStatusNotes(order.notes || '');
    setError('');
  };

  const saveStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      const response = await fetch('/api/admin/commerce/orders', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id, newStatus: statusDraft, notes: statusNotes }),
      });
      const result = await response.json() as { success?: boolean; order?: CommerceOrder; error?: string };
      if (!response.ok || !result.success || !result.order) throw new Error(result.error || 'Unable to update order status.');
      const updated = result.order;
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      setSelectedOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-purple-700"><Package className="h-3.5 w-3.5" /> Commerce monitoring</div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-2 text-[15px] text-slate-500">Review customer order details, product lines, fulfillment information, and status changes.</p>
        </div>
        <div className="flex items-center gap-2"><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button><button type="button" onClick={exportOrders} disabled={!filteredOrders.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"><Download className="h-4 w-4" /> Export</button></div>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, business, product" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
          <div className="flex flex-wrap items-center gap-2"><Filter className="h-4 w-4 text-slate-400" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"><option value="all">All statuses ({orders.length})</option>{STATUS_OPTIONS.map((status) => <option key={status.key} value={status.key}>{status.label} ({orders.filter((order) => order.status === status.key).length})</option>)}</select><button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Clear</button></div>
        </div>
        <div className="min-h-[400px] overflow-x-auto">
          {loading ? <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div> : <table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-slate-100 bg-white text-[11px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Business</th><th className="px-5 py-4">Products</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Date</th><th className="px-5 py-4 text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredOrders.map((order) => <tr key={order.id} className="hover:bg-slate-50/60"><td className="px-5 py-4 font-bold text-slate-900">{order.orderNumber}</td><td className="px-5 py-4"><div className="font-medium text-slate-800">{order.customerName || '—'}</div><div className="text-xs text-slate-500">{order.customerEmail || order.customerPhone || ''}</div></td><td className="px-5 py-4 text-slate-600">{businessName(order)}</td><td className="max-w-[260px] truncate px-5 py-4 text-slate-600" title={order.items.map((item) => `${item.productNameSnapshot} × ${item.quantity}`).join(', ')}>{order.items.map((item) => `${item.productNameSnapshot} × ${item.quantity}`).join(', ') || 'No product lines'}</td><td className="px-5 py-4 font-bold text-slate-900">₹{order.totalAmountInr.toLocaleString('en-IN')}</td><td className="px-5 py-4"><span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${statusClass(order.status)}`}>{order.status}</span></td><td className="px-5 py-4 text-xs text-slate-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => openDetails(order)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-3.5 w-3.5" /> View <ChevronRight className="h-3.5 w-3.5" /></button></td></tr>)}{!loading && filteredOrders.length === 0 && <tr><td colSpan={8} className="px-5 py-14 text-center text-slate-500">{orders.length ? 'No orders match the current filters.' : 'No commerce orders are available.'}</td></tr>}</tbody></table>}
        </div>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label="Order details">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div><div className="text-xs font-bold uppercase tracking-wider text-blue-600">Order detail</div><h2 className="mt-1 text-xl font-bold text-slate-900">{selectedOrder.orderNumber}</h2><p className="mt-1 text-xs text-slate-500">Created {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('en-IN') : '—'}</p></div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <InfoCard title="Customer"><p className="font-semibold text-slate-900">{selectedOrder.customerName || '—'}</p><p>{selectedOrder.customerEmail || 'No email recorded'}</p><p>{selectedOrder.customerPhone || 'No phone recorded'}</p><p className="mt-2 font-semibold text-slate-700">Business ID: {businessName(selectedOrder)}</p></InfoCard>
              <InfoCard title="Shipping"><p>{selectedOrder.shippingAddress || 'No shipping address recorded'}</p><p>{[selectedOrder.city, selectedOrder.state, selectedOrder.postalCode, selectedOrder.country].filter(Boolean).join(', ') || '—'}</p></InfoCard>
              <InfoCard title="Product lines"><div className="space-y-2">{selectedOrder.items.length ? selectedOrder.items.map((item: CommerceOrder['items'][number]) => <div key={item.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0"><span>{item.productNameSnapshot}</span><span className="font-semibold">× {item.quantity}</span></div>) : <p>No product lines recorded.</p>}</div><p className="mt-3 border-t border-slate-100 pt-3 text-right text-base font-bold text-slate-900">Total ₹{selectedOrder.totalAmountInr.toLocaleString('en-IN')}</p></InfoCard>
              <InfoCard title="Status history"><div className="space-y-2">{selectedOrder.statusHistory.length ? selectedOrder.statusHistory.map((entry) => <div key={entry.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0"><div className="flex justify-between gap-3 text-xs font-semibold text-slate-800"><span>{entry.newStatus}</span><span className="text-slate-400">{new Date(entry.createdAt).toLocaleString('en-IN')}</span></div>{entry.notes && <p className="mt-1 text-xs text-slate-500">{entry.notes}</p>}</div>) : <p>No status history recorded.</p>}</div></InfoCard>
              <InfoCard title="Admin status control"><form onSubmit={saveStatus} className="space-y-3"><label className="block"><span className="text-xs font-semibold text-slate-600">Fulfillment status</span><select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as CommerceOrderStatus)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{STATUS_OPTIONS.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}</select></label><label className="block"><span className="text-xs font-semibold text-slate-600">Internal note</span><textarea value={statusNotes} onChange={(event) => setStatusNotes(event.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><button type="submit" disabled={updating} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{updating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{updating ? 'Saving…' : 'Save status'}</button></form></InfoCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3><div className="space-y-1.5 leading-relaxed">{children}</div></section>;
}
