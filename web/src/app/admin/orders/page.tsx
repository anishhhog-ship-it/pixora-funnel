'use client';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminOrders } from '@/services/adminService';
import { Search, Filter, Download, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');

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

  const filteredOrders = useMemo(() => orders.filter((order) => `${order.order_no} ${order.customer_name} ${order.businesses?.name} ${order.status}`.toLowerCase().includes(search.toLowerCase())), [orders, search]);
  const exportOrders = () => {
    const csv = [['Order', 'Customer', 'Business', 'Products', 'Amount', 'Status', 'Date'], ...filteredOrders.map((order) => [order.order_no, order.customer_name || '', order.businesses?.name || '', order.products || '', order.amount, order.status, order.created_at])].map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'orders.csv'; link.click(); URL.revokeObjectURL(link.href);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Orders (Hardware)
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Manage NFC/QR product orders and dispatches.</p>
        </div>
        <button type="button" onClick={exportOrders} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><Download className="h-4 w-4" />Export</button>
      </div>

       <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, business, status" className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-100" /></div><button type="button" onClick={() => setSearch('')} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Filter className="h-4 w-4" />Clear</button></div>
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
                 {filteredOrders.map((o) => (
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
                 {!loading && filteredOrders.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No orders found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
