'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { verifyAdminAccess } from '@/services/adminService';
import Link from 'next/link';
import { 
  BarChart2, Users, Building2, Key, Clock, Layout, Star, MessageSquare, 
  QrCode, Package, ImageIcon, Activity, FileText, Settings, ShieldCheck, 
  Search, Bell, HelpCircle, Crown, CreditCard, Menu as MenuIcon, X, ExternalLink
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: BarChart2 },
  { href: '/sales', label: 'Sales Operations', icon: Activity },
  { href: '/sales/team', label: 'Sales Team', icon: Users },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { href: '/admin/activations', label: 'Activations', icon: Key },
  { href: '/admin/trials', label: 'Trials & Plans', icon: Clock },
  { href: '/admin/plans', label: 'Plans', icon: Crown },
  { href: '/admin/modules', label: 'Modules & Features', icon: Layout },
  { href: '/admin/google-integrations', label: 'Google Integrations', icon: Star },
  { href: '/admin/reviews', label: 'Reviews Monitoring', icon: Star },
  { href: '/admin/qr-codes', label: 'QR Codes', icon: QrCode },
  { href: '/admin/products', label: 'Product Inventory', icon: Package },
  { href: '/admin/orders', label: 'Order Monitoring', icon: Package },
  { href: '/admin/payments', label: 'Payment Approvals', icon: CreditCard },
  { href: '/admin/category-visuals', label: 'Category Visuals', icon: ImageIcon },
  { href: '/admin/support', label: 'Support Tickets', icon: MessageSquare },
  { href: '/admin/analytics', label: 'Analytics', icon: Activity },
  { href: '/admin/system-health', label: 'System Health', icon: ShieldCheck },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  { href: '/admin/settings', label: 'Admin Settings', icon: Settings },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [adminIdentity, setAdminIdentity] = useState({ email: 'Admin', role: 'Super Administrator' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/admin-login');
          return;
        }
        const access = await verifyAdminAccess(session.access_token);
        if (!access.isAdmin) {
          router.push('/dashboard');
          return;
        }
        setAdminIdentity({
          email: access.email || 'Admin',
          role: access.role === 'super_admin' ? 'Super Administrator' : access.role === 'support_agent' ? 'Support Agent' : 'Administrator',
        });
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin authentication check failed', error);
        router.push('/admin-login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-shell relative flex h-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="z-20 hidden w-[276px] flex-shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold leading-none text-white shadow-lg shadow-slate-950/15">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[17px] tracking-tight text-slate-900 leading-tight">Pixora</span>
              <span className="font-bold text-[10px] tracking-[0.2em] text-slate-500 uppercase leading-none mt-0.5">FUNNEL</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold text-amber-700">Super Admin</span>
          </div>
        </div>
        
        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Super admin navigation">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Control center</p>
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <NavLink key={item.href} href={item.href} icon={<Icon />} active={item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)}>{item.label}</NavLink>;
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <Link href="/dashboard" className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
            <ExternalLink className="h-4 w-4 text-slate-400 transition group-hover:text-blue-600" />
            <span>Open client portal</span>
          </Link>
        </div>

      </aside>

      {showMobileNav && (
        <>
          <button type="button" aria-label="Close admin navigation" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setShowMobileNav(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,320px)] flex-col border-r border-slate-200 bg-white shadow-2xl lg:hidden">
            <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-white">P</div>
                <div>
                  <p className="text-sm font-bold text-slate-950">Pixora</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Control center</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowMobileNav(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Close admin navigation"><X className="h-5 w-5" /></button>
            </div>
            <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Mobile super admin navigation">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return <NavLink key={item.href} href={item.href} icon={<Icon />} active={item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)} onClick={() => setShowMobileNav(false)}>{item.label}</NavLink>;
              })}
            </nav>
            <div className="border-t border-slate-100 p-4"><Link href="/dashboard" onClick={() => setShowMobileNav(false)} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700"><ExternalLink className="h-4 w-4 text-blue-600" />Open client portal</Link></div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
         <header className="z-10 flex h-20 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-8">
           <div className="flex min-w-0 flex-1 items-center gap-3 lg:max-w-2xl">
             <button type="button" onClick={() => setShowMobileNav(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white lg:hidden" aria-label="Open admin navigation"><MenuIcon className="h-5 w-5" /></button>
             <div className="relative group">
               <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
                <input
                  type="text"
                   placeholder="Search customers, businesses, orders..."
                   value={searchTerm}
                   onChange={(event) => setSearchTerm(event.target.value)}
                   onKeyDown={(event) => {
                     if (event.key !== 'Enter' || !searchTerm.trim()) return;
                     const value = searchTerm.trim();
                     const target = /order|pxo/i.test(value) ? '/admin/orders' : /business|store|company/i.test(value) ? '/admin/businesses' : '/admin/customers';
                     router.push(`${target}?search=${encodeURIComponent(value)}`);
                   }}
                   aria-label="Search admin workspace"
                 className="w-full pl-10 pr-12 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-700"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-400 rounded-md">⌘</kbd>
                 <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-400 rounded-md">K</kbd>
               </div>
             </div>
           </div>
           
             <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:ml-8 sm:gap-4">
              <button type="button" className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              <button type="button" className="hidden rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 sm:block" aria-label="Help and documentation">
                <HelpCircle className="w-5 h-5" />
             </button>
             
             <div className="w-px h-8 bg-slate-200 mx-2"></div>
             
              <div className="group flex cursor-default items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white ring-2 ring-slate-100 transition-all group-hover:ring-blue-100" aria-hidden="true">{adminIdentity.email.slice(0, 1).toUpperCase()}</div>
                 <div className="hidden text-left xl:block">
                   <div className="max-w-[150px] truncate text-sm font-bold leading-tight text-slate-900">{adminIdentity.email}</div>
                   <div className="text-[11px] font-medium text-slate-500">{adminIdentity.role}</div>
               </div>
             </div>
           </div>
        </header>

        {/* Page Content */}
          <div className="admin-content custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, children, active, onClick }: { href: string, icon: React.ReactNode, children: React.ReactNode, active: boolean, onClick?: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
        active 
          ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className={`h-4 w-4 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`}>{icon}</span>
      {children}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden="true" />}
    </Link>
  );
}
