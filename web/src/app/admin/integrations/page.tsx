'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminIntegrations } from '@/services/adminService';
import { Link, Search, RefreshCw, AlertCircle } from 'lucide-react';

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const data = await getAdminIntegrations(session.access_token);
          setIntegrations(data);
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
            Google Integrations
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Monitor Google API connection status across all businesses.</p>
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
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Google Account ID</th>
                  <th className="px-6 py-4">Connection Status</th>
                  <th className="px-6 py-4">Last Synced</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {integrations.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900">{i.businesses?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{i.google_account_id || 'Not Linked'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md w-max ${i.status === 'Connected' ? 'bg-emerald-50 text-emerald-700' : i.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{i.last_synced_at ? new Date(i.last_synced_at).toLocaleString() : 'Never'}</td>
                    <td className="px-6 py-4 text-blue-600 font-bold text-xs hover:text-blue-800 cursor-pointer flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Resync
                    </td>
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
