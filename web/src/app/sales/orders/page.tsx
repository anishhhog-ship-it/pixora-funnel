'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SalesOrder } from '@/types/sales';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';

type SalesOrderWithRelations = SalesOrder & { prospect?: { business_name?: string | null } | null; staff?: { full_name?: string | null } | null };

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<SalesOrder | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'VERIFIED' | 'FAILED'>('VERIFIED');
  const [reason, setReason] = useState('');
  const [receiptConfirmed, setReceiptConfirmed] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      const meRes = await fetch('/api/sales/me', { headers: { Authorization: session ? `Bearer ${session.access_token}` : '' } });
      const meData = await meRes.json();
      setStaffRole(meData.staff?.role || null);
      const res = await fetch('/api/sales/orders', {
        headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      } else setError(data.error || 'Orders could not be loaded.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Orders could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // This request synchronizes the screen with the authoritative orders endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const openReview = (order: SalesOrder, status: 'VERIFIED' | 'FAILED') => {
    setReviewOrder(order);
    setReviewStatus(status);
    setReason('');
    setReceiptConfirmed(false);
  };

  const handleVerify = async () => {
    if (!reviewOrder || !reason.trim() || !receiptConfirmed) return;
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
       const res = await fetch('/api/sales/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
         body: JSON.stringify({ orderId: reviewOrder.id, paymentStatus: reviewStatus, reason: reason.trim(), confirmation: 'bank_receipt_reviewed' }),
      });
      const data = await res.json();
      if (data.success) {
         setReviewOrder(null);
         fetchOrders();
      } else {
         setError(data.error || 'Payment verification failed');
      }
    } catch (e) {
       setError(e instanceof Error ? e.message : 'Payment verification failed.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.order_no.toLowerCase().includes(q) ||
      (o as SalesOrderWithRelations).prospect?.business_name?.toLowerCase().includes(q) ||
      o.transaction_reference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#5356EC]" />
            <span>Orders &amp; Payment Verification</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real commercial transactions, UTR reference tracking, and administrative verification.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order no, UTR, business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
          />
        </div>
      </div>

      {error && <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"><span>{error}</span><button type="button" onClick={fetchOrders} className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 font-bold">Retry</button></div>}
      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-[#5356EC] rounded-2xl flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            {search ? 'No matching orders found' : 'No commercial orders recorded yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'Try searching by a different order number or business name.'
              : 'Once a prospect accepts a plan and submits payment or UTR reference, orders will appear here for verification.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Order Details</th>
                  <th className="py-3 px-4">Client Business</th>
                  <th className="py-3 px-4">Plan &amp; Amount</th>
                  <th className="py-3 px-4">Payment Method &amp; UTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <p>{ord.order_no}</p>
                      <p className="text-[10px] text-slate-400 font-sans font-normal">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-bold text-slate-900">
                         {(ord as SalesOrderWithRelations).prospect?.business_name || 'Client Business'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                         Rep: {(ord as SalesOrderWithRelations).staff?.full_name || 'Direct'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">
                        {ord.plan_snapshot?.name || ord.plan_slug}
                      </p>
                      <p className="text-emerald-700 font-bold text-sm">
                         {ord.amount_inr != null ? `₹${ord.amount_inr.toLocaleString('en-IN')}` : 'Amount unavailable'}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium text-slate-800">{ord.payment_method}</p>
                      {ord.transaction_reference ? (
                        <p className="text-[11px] font-mono text-[#5356EC] font-semibold mt-0.5">
                          UTR: {ord.transaction_reference}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No UTR submitted</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          ord.payment_status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.payment_status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : ord.payment_status === 'PENDING'
                            ? 'bg-indigo-50 text-[#5356EC] border-indigo-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {ord.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                       {ord.payment_status !== 'VERIFIED' && staffRole !== 'salesperson' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                             onClick={() => openReview(ord, 'VERIFIED')}
                            className="min-h-11 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                             onClick={() => openReview(ord, 'FAILED')}
                            className="min-h-11 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[11px] font-semibold border border-slate-200 cursor-pointer transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                       ) : ord.payment_status === 'VERIFIED' ? (
                         <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-end gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved</span>
                         </span>
                       ) : (
                         <span className="text-[11px] text-amber-700 font-semibold">Awaiting manager verification</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between"><div><h2 className="text-base font-bold text-slate-900">{reviewStatus === 'VERIFIED' ? 'Approve payment' : 'Reject payment'}</h2><p className="mt-1 text-xs text-slate-500">{reviewOrder.order_no} · {reviewOrder.transaction_reference || 'No reference'}</p></div><button type="button" onClick={() => setReviewOrder(null)} aria-label="Close" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
            <label className="block text-xs font-semibold text-slate-700">Reason <textarea required rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What did you verify or why is this being rejected?" className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500" /></label>
            <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={receiptConfirmed} onChange={(event) => setReceiptConfirmed(event.target.checked)} className="mt-0.5 h-4 w-4" />I reviewed the bank/payment receipt and confirm this decision.</label>
            <button type="button" disabled={updating || !reason.trim() || !receiptConfirmed} onClick={handleVerify} className="min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white disabled:opacity-50">{updating ? 'Saving decision…' : `Confirm ${reviewStatus === 'VERIFIED' ? 'approval' : 'rejection'}`}</button>
          </div>
        </div>
      )}
    </div>
  );
}
