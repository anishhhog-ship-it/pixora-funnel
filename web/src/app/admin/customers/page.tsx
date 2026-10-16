'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminCustomers, updateDashboardStatus } from '@/services/adminService';
import { Search, Filter, MoreHorizontal, User, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const filtered = customers.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,SignupDate\n" + 
      filtered.map(c => `${c.name || ''},${c.email || ''},${c.signupDate || ''}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setSessionToken(session.access_token);
      try {
        const data = await getAdminCustomers(session.access_token);
        setCustomers(data);
      } catch (err) {
        console.error("Failed to load customers", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleStatusUpdate = async (bizId: string, newStatus: string) => {
    try {
      await updateDashboardStatus(sessionToken, bizId, newStatus, 'Manual admin override');
      setCustomers(customers.map(c => {
        if (c.business && c.business.id === bizId) {
            return { ...c, business: { ...c.business, status: newStatus }, dashboardStatus: newStatus };
        }
        return c;
      }));
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">Customer Management</h1>
          <p className="text-sm text-slate-500 mt-1">View all registered platform users and their business statuses.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
             Export CSV
           </button>
           <button onClick={() => setSearchQuery('')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">
              <Filter className="w-4 h-4" /> Clear search
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-100" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium">Signup Date</th>
                <th className="px-6 py-3 font-medium">Dashboard</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading customers...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No customers found.</td></tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.customerId || i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {c.name ? c.name.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{c.name || 'Unknown User'}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{c.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.business ? (
                        <div>
                          <div className="font-bold text-slate-800">{c.business.name}</div>
                          <div className="text-xs text-slate-400">{c.business.category || 'No Category'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No business linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {c.signupDate ? format(new Date(c.signupDate), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {c.business ? (
                        <select 
                           className={`text-xs font-bold px-2 py-1 rounded-md border-0 outline-none cursor-pointer ${c.business.status === 'active' ? 'bg-emerald-50 text-emerald-700' : c.business.status === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}
                           value={c.business.status || 'pending'}
                          onChange={(e) => handleStatusUpdate(c.business.id, e.target.value)}
                        >
                          <option value="pending">Pending Setup</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="deactivated">Deactivated</option>
                        </select>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === (c.customerId || i) ? null : (c.customerId || i))} 
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenuId === (c.customerId || i) && (
                        <div className="absolute right-8 top-10 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 text-left flex flex-col">
                            {c.business ? <Link href="/admin/businesses" onClick={() => setOpenMenuId(null)} className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">View Business</Link> : <span className="block px-4 py-2 text-sm text-slate-400">No business linked</span>}
                            {c.email ? <a href={`mailto:${c.email}`} onClick={() => setOpenMenuId(null)} className="block w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50">Email Customer</a> : <span className="block px-4 py-2 text-sm text-slate-400">No email available</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
