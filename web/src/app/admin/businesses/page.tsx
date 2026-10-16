'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { createAdminBusiness, getAdminBusinesses, updateDashboardStatus } from '@/services/adminService';
import { Building2, Search, MoreHorizontal, Store, Plus, Filter, Download } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function AdminBusinessesPage() {
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: '', slug: '', category: '' });
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddBusiness = async () => {
    setActionError('');
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      const created = await createAdminBusiness(session.access_token, newBiz);
      setBusinesses((current) => [created, ...current]);
      setIsAddModalOpen(false);
      setNewBiz({ name: '', slug: '', category: '' });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to provision business.');
    } finally {
      setIsSaving(false);
    }
  };

  const suspendBusiness = async (business: any) => {
    setActionError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      await updateDashboardStatus(session.access_token, business.id, 'suspended', 'Suspended by administrator');
      setBusinesses((current) => current.map((item) => item.id === business.id ? { ...item, status: 'suspended' } : item));
      setSelectedBusiness(null);
      setOpenMenuId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to suspend business.');
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.owner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Business\n" + 
      filteredBusinesses.map(b => `${b.owner?.full_name || ''},${b.owner?.email || ''},${b.name || ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "businesses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const data = await getAdminBusinesses(session.access_token);
          setBusinesses(data);
        }
      } catch (err) {
        console.error('Failed to fetch businesses', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBusinesses();
  }, []);


  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      {actionError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{actionError}</div>}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Business Directory
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Manage all businesses using Pixora Funnel across the globe.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Export</span>
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-blue-600 border border-blue-700 rounded-xl px-4 py-2 shadow-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">Add Business</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by business, owner, or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-700"
            />
          </div>
           <button onClick={() => setSearchQuery('')} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4 text-slate-500" />
             <span className="text-sm font-semibold text-slate-700">Clear search</span>
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
                  <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBusinesses.map((b, i) => {
                  const trial = b.trial;
                   let status = b.status === 'suspended' ? 'Suspended' : 'Active';
                   let statusColor = 'bg-emerald-50 text-emerald-700';

                   if (b.status === 'suspended') statusColor = 'bg-rose-50 text-rose-700';
                  
                   if (b.status !== 'suspended' && trial?.status === 'active') {
                    status = 'Trial';
                    statusColor = 'bg-blue-50 text-blue-700';
                    const daysLeft = trial.expires_at ? Math.ceil((new Date(trial.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
                    if (daysLeft < 0) { status = 'Expired'; statusColor = 'bg-rose-50 text-rose-700'; }
                   } else if (b.status !== 'suspended' && trial?.status === 'expired') {
                    status = 'Expired';
                    statusColor = 'bg-rose-50 text-rose-700';
                  }

                  const bgColors = ['bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700', 'bg-pink-100 text-pink-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'];
                  const colorIndex = i % bgColors.length;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${bgColors[colorIndex]}`}>
                            {b.name ? b.name.substring(0,2).toUpperCase() : <Store className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{b.name}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                               {b.category || 'Uncategorized'} • /{b.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{b.owner?.full_name || 'No Owner'}</div>
                        <div className="text-xs text-slate-500">{b.owner?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-max ${statusColor}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${statusColor.split(' ')[0].replace('bg-', 'bg-').replace('50', '500')}`}></div>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {trial?.status === 'active' ? 'Trial' : 'Pro'}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-slate-400 hover:text-slate-700 cursor-pointer relative">
                        <div 
                          onClick={() => setOpenMenuId(openMenuId === b.id ? null : b.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                        >
                           <MoreHorizontal className="w-5 h-5" />
                        </div>
                        {openMenuId === b.id && (
                          <div className="absolute right-8 top-10 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 text-left flex flex-col">
                             <button onClick={() => suspendBusiness(b)} disabled={b.status === 'suspended'} className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left disabled:cursor-not-allowed disabled:text-slate-400">{b.status === 'suspended' ? 'Business Suspended' : 'Suspend Business'}</button>
                             <button onClick={() => { setSelectedBusiness(b); setOpenMenuId(null); }} className="block w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 text-left">View Details</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredBusinesses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <Building2 className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-base font-semibold text-slate-700">No businesses found</p>
                        <p className="text-sm mt-1">Try adjusting your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Business Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Provision New Business</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name</label>
                <input type="text" value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <input type="text" value={newBiz.category} onChange={e => setNewBiz({...newBiz, category: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" placeholder="e.g. Retail" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL Slug</label>
                <input type="text" value={newBiz.slug} onChange={e => setNewBiz({...newBiz, slug: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" placeholder="e.g. acme-corp" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
               <button onClick={handleAddBusiness} disabled={isSaving || !newBiz.name.trim() || !newBiz.slug.trim()} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? 'Provisioning…' : 'Provision Business'}</button>
            </div>
          </div>
        </div>
      )}

      {/* View Business Details Modal */}
      {selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedBusiness.name}</h3>
                <p className="text-sm text-slate-500 mt-1">/{selectedBusiness.slug} • {selectedBusiness.category || 'Uncategorized'}</p>
              </div>
              <button onClick={() => setSelectedBusiness(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Owner Name</div>
                  <div className="font-bold text-slate-800">{selectedBusiness.owner?.full_name || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Contact Email</div>
                  <div className="font-bold text-slate-800 break-all">{selectedBusiness.owner?.email || 'N/A'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Plan Status</div>
                  <div className="font-bold text-slate-800">{selectedBusiness.trial?.status === 'active' ? 'Trial' : 'Pro'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-1">Joined Date</div>
                  <div className="font-bold text-slate-800">{new Date(selectedBusiness.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Quick Actions</h4>
                <div className="flex gap-3">
                   <span className="flex-1 rounded-lg bg-slate-50 px-4 py-2 text-center text-xs font-medium text-slate-500">Owner actions require a linked account.</span>
                   <button onClick={() => suspendBusiness(selectedBusiness)} disabled={selectedBusiness.status === 'suspended'} className="flex-1 rounded-lg bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50">{selectedBusiness.status === 'suspended' ? 'Suspended' : 'Suspend'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
