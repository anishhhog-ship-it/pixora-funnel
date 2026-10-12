'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminBusinesses, extendBusinessTrial } from '@/services/adminService';
import { Clock, Search, Filter, Crown, AlertTriangle } from 'lucide-react';

export default function AdminTrialsPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExtendingId, setIsExtendingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const data = await getAdminBusinesses(session.access_token);
        setBusinesses(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendTrial = async (businessId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to extend the trial for ${businessName} by 7 days?`)) return;
    
    try {
      setIsExtendingId(businessId);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await extendBusinessTrial(session.access_token, businessId, 7);
      alert(`Successfully extended trial for ${businessName} by 7 days!`);
      await loadData(); // Refresh UI
    } catch (e: any) {
      alert(`Failed to extend trial: ${e.message}`);
    } finally {
      setIsExtendingId(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Trials & Plans
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Monitor subscription statuses, expiring trials, and upgrades.</p>
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
                  <th className="px-6 py-4">Current Plan</th>
                  <th className="px-6 py-4">Trial Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {businesses.map((b) => {
                  const trial = b.trial;
                  const daysLeft = trial?.expires_at ? Math.ceil((new Date(trial.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
                  const isTrial = trial?.status === 'active';
                  
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{b.name}</div>
                        <div className="text-xs text-slate-500">{b.owner?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                         {isTrial ? (
                           <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-700 w-max">
                            Free Trial
                           </span>
                         ) : (
                           <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-700 flex items-center gap-1 w-max">
                            <Crown className="w-3 h-3" /> Pro Plan
                           </span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        {isTrial ? (
                           daysLeft > 3 ? (
                             <span className="text-slate-600 font-medium">{daysLeft} days remaining</span>
                           ) : daysLeft >= 0 ? (
                             <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Expires in {daysLeft} days</span>
                           ) : (
                             <span className="text-rose-600 font-bold">Expired</span>
                           )
                        ) : (
                           <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td 
                        onClick={() => !isExtendingId && handleExtendTrial(b.id, b.name)}
                        className={`px-6 py-4 font-bold text-xs ${isExtendingId === b.id ? 'text-slate-400 cursor-wait' : 'text-blue-600 hover:text-blue-800 cursor-pointer'}`}
                      >
                        {isExtendingId === b.id ? 'Extending...' : 'Extend Trial'}
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
