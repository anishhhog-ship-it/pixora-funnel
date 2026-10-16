'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminActivations, createActivationKey, revokeBusinessAccess } from '@/services/adminService';
import Link from 'next/link';
import { Key, Search, Filter, ArrowRight, ShieldCheck, Download, Smartphone, Globe } from 'lucide-react';

export default function AdminActivationsPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [generatedKeyData, setGeneratedKeyData] = useState<{ businessName: string; key: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionError, setActionError] = useState('');

  const generateActivationKey = async (business: any) => {
    try {
      setIsGenerating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const keyData = await createActivationKey(session.access_token, business.id) as any;
      setGeneratedKeyData({ businessName: business.name, key: keyData.key_string });
      setBusinesses((current) => current.map((item) => item.id === business.id ? { ...item, activationKeys: [...(item.activationKeys || []), keyData] } : item));
    } catch (e) {
      console.error(e);
      setActionError(e instanceof Error ? e.message : 'Failed to generate activation key.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const data = await getAdminActivations(session.access_token);
          setBusinesses(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = businesses.filter(b => 
    b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportReport = () => {
    const rows = filtered.map((business) => [business.name, business.owner?.email || '', business.status || '', business.activationKeys?.length || 0, business.qrCodes?.length || 0]);
    const csv = [['Business', 'Owner Email', 'Access Status', 'Activation Keys', 'QR Codes'], ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'activation-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const revoke = async (business: any) => {
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      await revokeBusinessAccess(session.access_token, business.id);
      setBusinesses((current) => current.map((item) => item.id === business.id ? { ...item, status: 'suspended' } : item));
    } catch (e) { setActionError(e instanceof Error ? e.message : 'Unable to revoke access.'); }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
       {actionError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>}
       <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Activations & Provisioning
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Manage smart dashboard features and device provisioning.</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={exportReport} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Export Report</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by business or owner email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-700"
            />
          </div>
           <button onClick={() => setSearchQuery('')} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Filters</span>
          </button>
        </div>

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
                  <th className="px-6 py-4">Dashboard Access</th>
                  <th className="px-6 py-4">Mobile App</th>
                  <th className="px-6 py-4">NFC/QR Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b, i) => {
                  const hasQr = b.qrCodes?.some((qr: any) => qr.status === 'active');
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{b.name}</div>
                        <div className="text-xs text-slate-500">{b.owner?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-max ${b.status === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                           <Globe className="w-3 h-3" /> {b.status === 'suspended' ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                          {b.status !== 'suspended' ? (
                           <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1 w-max">
                            <Smartphone className="w-3 h-3" /> Provisioned
                           </span>
                         ) : (
                           <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-500 flex items-center gap-1 w-max">
                            Locked (Free)
                           </span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-max ${hasQr ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                           <ShieldCheck className="w-3 h-3" /> {hasQr ? 'Configured' : 'Not configured'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-blue-600 font-bold text-xs hover:text-blue-800 cursor-pointer relative">
                        <div onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)} className="flex items-center gap-1 w-max">
                          Manage <ArrowRight className="w-3 h-3" />
                        </div>
                        {openMenuId === b.id && (
                          <div className="absolute right-8 top-10 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 text-left font-medium text-sm flex flex-col">
                            <button onClick={() => { generateActivationKey(b); setOpenMenuId(null); }} disabled={isGenerating} className="block w-full px-4 py-2 text-blue-600 hover:bg-slate-50 text-left disabled:opacity-50">Generate Activation Key</button>
                             <Link href="/admin/modules" onClick={() => setOpenMenuId(null)} className="block w-full px-4 py-2 text-slate-700 hover:bg-slate-50">Manage Features</Link>
                             <button onClick={() => { revoke(b); setOpenMenuId(null); }} disabled={b.status === 'suspended'} className="block w-full px-4 py-2 text-rose-600 hover:bg-rose-50 text-left disabled:text-slate-400">{b.status === 'suspended' ? 'Access Revoked' : 'Revoke Access'}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Generated Key Modal */}
      {generatedKeyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-center">
            <div className="p-8 pb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Key Generated!</h3>
              <p className="text-sm text-slate-500 mb-6">A new Pro Access key has been created and saved for <strong>{generatedKeyData.businessName}</strong>.</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between group">
                <code className="text-lg font-mono font-bold text-slate-800 tracking-wide select-all">
                  {generatedKeyData.key}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKeyData.key);
                    alert('Copied to clipboard!');
                  }} 
                  className="bg-white border border-slate-200 rounded-lg p-2 text-slate-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
              <button 
                onClick={() => setGeneratedKeyData(null)} 
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm w-full"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
