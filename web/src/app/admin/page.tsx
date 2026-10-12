'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getAdminDashboardData } from '@/services/adminService';
import { 
  Users, Building2, Monitor, Clock, UserX, Star, 
  ChevronDown, MoreHorizontal, Calendar, ShieldCheck
} from 'lucide-react';
import { AdminGrowthChart, AdminAccountStatusChart } from './AdminCharts';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const dashboardData = await getAdminDashboardData(session.access_token, days);
          setData(dashboardData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [days]);

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  const { 
    kpis, growthData, accountStatusData, totalAccounts, recentCustomers, 
    trialExpiring, recentOrders, googleIntegrationStatus: gi, supportTickets: st 
  } = data;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back,<br/>Pixora Funnel Admin <span className="text-2xl">👋</span>
          </h1>
          <p className="text-[15px] text-slate-500 mt-2">Manage your customers, monitor platform activity, control activations and grow your business.</p>
        </div>
        <div className="relative">
          <div 
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Last {days} Days</span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
          </div>
          {showDatePicker && (
            <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-xl shadow-lg w-48 z-50 overflow-hidden">
              {[7, 30, 90, 180, 365].map(d => (
                <button
                  key={d}
                  onClick={() => { setDays(d); setShowDatePicker(false); }}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                >
                  Last {d} Days
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <KpiCard icon={<Users className="w-5 h-5 text-blue-600"/>} iconBg="bg-blue-100" value={kpis.totalCustomers.toLocaleString()} label="Total Customers" trend={`${data.trends.totalCustomers >= 0 ? '+' : ''}${data.trends.totalCustomers}%`} trendUp={data.trends.totalCustomers >= 0} />
        <KpiCard icon={<Building2 className="w-5 h-5 text-purple-600"/>} iconBg="bg-purple-100" value={kpis.totalBusinesses.toLocaleString()} label="Total Businesses" trend={`${data.trends.totalBusinesses >= 0 ? '+' : ''}${data.trends.totalBusinesses}%`} trendUp={data.trends.totalBusinesses >= 0} />
        <KpiCard icon={<Monitor className="w-5 h-5 text-emerald-600"/>} iconBg="bg-emerald-100" value={kpis.activeDashboards.toLocaleString()} label="Active Dashboards" trend={`${data.trends.activeDashboards >= 0 ? '+' : ''}${data.trends.activeDashboards}%`} trendUp={data.trends.activeDashboards >= 0} />
        <KpiCard icon={<Clock className="w-5 h-5 text-amber-600"/>} iconBg="bg-amber-100" value={kpis.activeTrials.toLocaleString()} label="Active Trials" trend={`${data.trends.activeTrials >= 0 ? '+' : ''}${data.trends.activeTrials}%`} trendUp={data.trends.activeTrials >= 0} />
        <KpiCard icon={<UserX className="w-5 h-5 text-rose-600"/>} iconBg="bg-rose-100" value={kpis.suspendedAccounts.toLocaleString()} label="Suspended Accounts" trend={`${data.trends.suspendedAccounts >= 0 ? '+' : ''}${data.trends.suspendedAccounts}%`} trendUp={data.trends.suspendedAccounts >= 0} />
        <KpiCard icon={<Star className="w-5 h-5 text-blue-600"/>} iconBg="bg-blue-100" value={kpis.connectedGoogle.toLocaleString()} label="Connected Google" trend={`${data.trends.connectedGoogle >= 0 ? '+' : ''}${data.trends.connectedGoogle}%`} trendUp={data.trends.connectedGoogle >= 0} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-slate-900">Platform Growth</h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>New Customers</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Active Businesses</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-500"></div>QR Scans</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div>Reviews</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer">
                Last 30 Days <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <AdminGrowthChart data={growthData} />
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900">Account Status</h2>
            <a href="#" className="text-sm font-bold text-blue-600 hover:underline">View All</a>
          </div>
          <AdminAccountStatusChart data={accountStatusData} total={totalAccounts} />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Customers */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Customers</h2>
            <a href="#" className="text-sm font-bold text-blue-600 hover:underline">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Trial Status</th>
                  <th className="px-6 py-4">Dashboard</th>
                  <th className="px-6 py-4">Signup Date</th>
                  <th className="px-6 py-4">Last Active</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCustomers.map((c: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${c.bg}`}>{c.initials}</div>
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{c.business}</div>
                      <div className="text-xs text-slate-500">{c.category}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{c.plan}</td>
                    <td className="px-6 py-4">
                      {c.trialStatus === '-' ? (
                        <span className="text-slate-400 font-medium">-</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md w-max ${c.trialStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' : c.trialStatus === 'Expires' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                            {c.trialStatus === 'Active' && '+ '}{c.trialStatus}
                          </span>
                          {c.trialLeft && <span className={`text-[10px] font-bold ${c.trialStatus === 'Expires' ? 'text-amber-600' : 'text-emerald-600'}`}>{c.trialLeft}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-max ${c.dash === 'Active' ? 'bg-emerald-50 text-emerald-700' : c.dash === 'Suspended' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${c.dash === 'Active' ? 'bg-emerald-500' : c.dash === 'Suspended' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                        {c.dash}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{c.signup}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{c.active}</td>
                    <td className="px-6 py-4 text-slate-400 hover:text-slate-700 cursor-pointer relative">
                      <div 
                        onClick={() => {
                          const el = document.getElementById(`menu-${i}`);
                          if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                      >
                         <MoreHorizontal className="w-5 h-5" />
                      </div>
                      <div id={`menu-${i}`} style={{ display: 'none' }} className="absolute right-8 top-10 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 text-left font-medium text-sm">
                        <button onClick={() => alert('View user details')} className="w-full px-4 py-2 text-slate-700 hover:bg-slate-50 text-left">View Details</button>
                        <button onClick={() => alert('Suspend user')} className="w-full px-4 py-2 text-slate-700 hover:bg-slate-50 text-left">Suspend User</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentCustomers.length === 0 && (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">No recent customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trial Expiring Soon */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Trial Expiring Soon</h2>
            <a href="#" className="text-sm font-bold text-blue-600 hover:underline">View All</a>
          </div>
          <div className="space-y-4">
            {trialExpiring.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${t.bg}`}>{t.initials}</div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold flex items-center gap-1 ${t.danger ? 'text-rose-600' : 'text-amber-600'}`}>
                    <Clock className="w-3.5 h-3.5" /> {t.time}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                </div>
              </div>
            ))}
            {trialExpiring.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-4">No expiring trials.</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <a href="#" className="text-sm font-bold text-blue-600 hover:underline">View All</a>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order No.</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{o.id}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{o.customer}</td>
                    <td className="px-5 py-3.5 text-slate-600">{o.products}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{o.amount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-1 rounded-md font-bold text-[10px] uppercase flex items-center gap-1 w-max ${o.statusColor}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${o.statusColor.split(' ')[0].replace('text-', 'bg-')}`}></div>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-500">No recent orders.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Google Integration Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-900">Google Integration Status</h2>
            <a href="#" className="text-sm font-bold text-blue-600 hover:underline">View All</a>
          </div>
          <div className="flex-1 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-emerald-500"></div></div> Connected</div>
              <div className="flex items-center gap-2"><span className="font-bold text-slate-900">{gi.connected}</span><span className="text-slate-400 text-xs w-10 text-right">({Math.round(gi.connected/gi.total*100)}%)</span></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center"><UserX className="w-3 h-3 text-rose-500"/></div> Disconnected</div>
              <div className="flex items-center gap-2"><span className="font-bold text-slate-900">{gi.disconnected}</span><span className="text-slate-400 text-xs w-10 text-right">({Math.round(gi.disconnected/gi.total*100)}%)</span></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center"><Monitor className="w-3 h-3 text-amber-500"/></div> Reconnection Required</div>
              <div className="flex items-center gap-2"><span className="font-bold text-slate-900">{gi.reconnect}</span><span className="text-slate-400 text-xs w-10 text-right">({Math.round(gi.reconnect/gi.total*100)}%)</span></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center"><Clock className="w-3 h-3 text-blue-500"/></div> Pending</div>
              <div className="flex items-center gap-2"><span className="font-bold text-slate-900">{gi.pending}</span><span className="text-slate-400 text-xs w-10 text-right">({Math.round(gi.pending/gi.total*100)}%)</span></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center"><span className="text-rose-500 font-bold text-[10px]">!</span></div> Failed</div>
              <div className="flex items-center gap-2"><span className="font-bold text-slate-900">{gi.failed}</span><span className="text-slate-400 text-xs w-10 text-right">({Math.round(gi.failed/gi.total*100)}%)</span></div>
            </div>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-900">Support Tickets</h2>
            <a href="#" className="text-sm font-bold text-blue-600 hover:underline">View All</a>
          </div>
          <div className="flex-1 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-md bg-rose-50 flex items-center justify-center"><div className="w-2.5 h-3 rounded-[2px] bg-rose-500"></div></div> Open</div>
              <div className="font-bold text-slate-900">{st.open}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center"><Clock className="w-3 h-3 text-amber-500"/></div> Pending Reply</div>
              <div className="font-bold text-slate-900">{st.pending}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-md bg-emerald-50 flex items-center justify-center"><ShieldCheck className="w-3 h-3 text-emerald-500"/></div> Resolved</div>
              <div className="font-bold text-slate-900">{st.resolved}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold"><div className="w-5 h-5 rounded-md bg-rose-50 flex items-center justify-center"><Star className="w-3 h-3 text-rose-500"/></div> High Priority</div>
              <div className="font-bold text-slate-900">{st.high}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, iconBg, value, label, trend, trendUp }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trendUp ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
          )}
          {trend}
        </div>
      </div>
      <div>
        <div className="text-[28px] font-bold text-slate-900 leading-none mb-1.5">{value}</div>
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="text-[10px] font-medium text-slate-400 mt-1">vs last month</div>
      </div>
    </div>
  );
}
