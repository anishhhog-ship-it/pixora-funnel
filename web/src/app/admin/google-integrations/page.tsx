'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminIntegrations } from '@/services/adminService';
import { RefreshCw, Search, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function AdminGoogleIntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isResyncing, setIsResyncing] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResync = async (id: string) => {
    setIsResyncing(id);
    setTimeout(() => {
      setIsResyncing(null);
      loadData();
    }, 1000);
  };

  const filtered = integrations.filter((i) => {
    const name = i.businesses?.name || '';
    const acc = i.google_account_id || '';
    const query = searchTerm.toLowerCase();
    return name.toLowerCase().includes(query) || acc.toLowerCase().includes(query);
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Google Integrations Monitoring
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time verification and connection status of Google Places &amp; Business profiles across all registered businesses.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-800 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 max-w-md shadow-2xs">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by business name or Google Place ID..."
          className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-hidden"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto min-h-[360px]">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Google Integrations Found</p>
              <p className="text-xs text-slate-400 mt-0.5">Businesses connecting Google Place IDs or review links will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Business Name</th>
                  <th className="px-6 py-4">Google Location / Place ID</th>
                  <th className="px-6 py-4">Integration Status</th>
                  <th className="px-6 py-4">Last Verified</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((i) => {
                  const isConnected = i.status === 'Connected';
                  return (
                    <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{i.businesses?.name || '-'}</td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        {i.google_account_id || 'Not Linked'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            isConnected
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConnected ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          {isConnected ? 'Connected' : 'Not Connected'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {i.last_synced_at ? new Date(i.last_synced_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleResync(i.id)}
                          disabled={isResyncing === i.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isResyncing === i.id ? 'animate-spin' : ''}`} />
                          <span>{isResyncing === i.id ? 'Verifying...' : 'Verify'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
