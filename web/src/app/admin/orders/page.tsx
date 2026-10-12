'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminOrders } from '@/services/adminService';
import { Search, Filter, Download, Package } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const data = await getAdminOrders(session.access_token);
          setOrders(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Orders (Hardware)
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Manage NFC/QR product orders and dispatches.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Order No</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Products</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{o.order_no}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{o.customer_name || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{o.businesses?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{o.products}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{o.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md w-max ${o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : o.status === 'Dispatched' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
