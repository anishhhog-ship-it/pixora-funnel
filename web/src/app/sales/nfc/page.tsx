'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { NfcOrder, NfcOrderStatus } from '@/types/sales';
import {
  QrCode,
  Truck,
  Package,
  CheckCircle2,
  MapPin,
  Phone,
  Search,
  ExternalLink,
  Edit2,
  X,
} from 'lucide-react';

export default function NfcFulfillmentPage() {
  const [orders, setOrders] = useState<NfcOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOrder, setEditOrder] = useState<NfcOrder | null>(null);

  // Edit State
  const [status, setStatus] = useState<NfcOrderStatus>('Ordered');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchNfcOrders = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/nfc', {
        headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.nfcOrders || []);
      }
    } catch (e) {
      console.warn('Fetch NFC orders error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNfcOrders();
  }, []);

  const handleOpenEdit = (ord: NfcOrder) => {
    setEditOrder(ord);
    setStatus(ord.status);
    setCourierName(ord.courier_name || '');
    setTrackingNumber(ord.tracking_number || '');
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder) return;
    setUpdating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/nfc', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          nfcOrderId: editOrder.id,
          status,
          courierName,
          trackingNumber,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditOrder(null);
        fetchNfcOrders();
      } else {
        alert(data.error || 'Failed to update shipping');
      }
    } catch (e) {
      console.warn('Update shipping error:', e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#5356EC]" />
            <span>NFC &amp; Physical Asset Fulfillment</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage custom printed NFC review cards, table display stands, and courier delivery tracking.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-[#5356EC] rounded-2xl flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No NFC physical orders pending</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When a salesperson converts a customer on a plan including NFC delivery, the shipping order will automatically populate here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Recipient &amp; Business</th>
                  <th className="py-3 px-4">Hardware Asset</th>
                  <th className="py-3 px-4">Shipping Destination</th>
                  <th className="py-3 px-4">Courier &amp; Tracking</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <p>{ord.recipient_name}</p>
                      <p className="text-[11px] text-slate-500 font-normal">
                        {(ord as any).business?.name || 'Customer Business'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-normal">{ord.contact_phone}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#5356EC] border border-indigo-200 font-bold text-[11px]">
                        {ord.nfc_asset_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <p className="line-clamp-2">{ord.shipping_address}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {ord.city}, {ord.state} - {ord.pincode}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {ord.courier_name || ord.tracking_number ? (
                        <div>
                          <p className="font-semibold text-slate-900">{ord.courier_name || 'Courier'}</p>
                          <p className="text-[11px] font-mono text-[#5356EC] font-semibold">{ord.tracking_number}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No tracking info yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : ord.status === 'Dispatched'
                            ? 'bg-indigo-50 text-[#5356EC] border-indigo-200'
                            : ord.status === 'In Production'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(ord)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Update Dispatch</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Fulfillment Modal */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900 text-base">Update Shipping &amp; Courier</h3>
              <button
                onClick={() => setEditOrder(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTracking} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Fulfillment Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NfcOrderStatus)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                >
                  <option value="Ordered">Ordered (Awaiting Print)</option>
                  <option value="In Production">In Production (Printing Card / Stand)</option>
                  <option value="Dispatched">Dispatched (Handed to Courier)</option>
                  <option value="Delivered">Delivered (Confirmed by Courier)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Courier Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Blue Dart, Delhivery, DTDC"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Courier Tracking / AWB Number</label>
                <input
                  type="text"
                  placeholder="e.g. BLD928192831"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
