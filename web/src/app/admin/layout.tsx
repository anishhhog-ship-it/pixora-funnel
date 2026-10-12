'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { 
  BarChart2, Users, Building2, Key, Clock, Layout, Star, MessageSquare, 
  QrCode, Package, ImageIcon, Activity, FileText, Settings, ShieldCheck, 
  Search, Bell, HelpCircle, ArrowRight, Crown, HeadphonesIcon
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin-login');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col z-20 flex-shrink-0">
        <div className="h-20 px-6 flex items-center justify-between border-b border-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl leading-none">
              P
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[17px] tracking-tight text-slate-900 leading-tight">Pixora</span>
              <span className="font-bold text-[10px] tracking-[0.2em] text-slate-500 uppercase leading-none mt-0.5">FUNNEL</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
            <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span className="text-[10px] font-bold text-amber-700">Super Admin</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 scrollbar-hide">
          <NavLink href="/admin" icon={<BarChart2 />} active={pathname === '/admin'}>Overview</NavLink>
          <NavLink href="/admin/customers" icon={<Users />} active={pathname.includes('/customers')}>Customers</NavLink>
          <NavLink href="/admin/businesses" icon={<Building2 />} active={pathname.includes('/businesses')}>Businesses</NavLink>
          <NavLink href="/admin/activations" icon={<Key />} active={pathname.includes('/activations')}>Activations</NavLink>
          <NavLink href="/admin/trials" icon={<Clock />} active={pathname.includes('/trials')}>Trials & Plans</NavLink>
          <NavLink href="/admin/modules" icon={<Layout />} active={pathname.includes('/modules')}>Modules & Features</NavLink>
          <NavLink href="/admin/google-integrations" icon={<Star />} active={pathname.includes('/google-integrations')}>Google Integrations</NavLink>
          <NavLink href="/admin/reviews" icon={<Star />} active={pathname.includes('/reviews')}>Reviews Monitoring</NavLink>
          <NavLink href="/admin/qr-codes" icon={<QrCode />} active={pathname.includes('/qr-codes')}>QR Codes</NavLink>
          <NavLink href="/admin/orders" icon={<Package />} active={pathname.includes('/orders')}>Orders & Products</NavLink>
          <NavLink href="/admin/category-visuals" icon={<ImageIcon />} active={pathname.includes('/category-visuals')}>Category Visuals</NavLink>
          <NavLink href="/admin/support" icon={<MessageSquare />} active={pathname.includes('/support')}>Support Tickets</NavLink>
          <NavLink href="/admin/analytics" icon={<Activity />} active={pathname.includes('/analytics')}>Analytics</NavLink>
          <NavLink href="/admin/system-health" icon={<ShieldCheck />} active={pathname.includes('/system-health')}>System Health</NavLink>
          <NavLink href="/admin/audit-logs" icon={<FileText />} active={pathname.includes('/audit-logs')}>Audit Logs</NavLink>
          <NavLink href="/admin/settings" icon={<Settings />} active={pathname.includes('/settings')}>Admin Settings</NavLink>
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 flex-shrink-0">
           <div className="flex-1 max-w-2xl">
             <div className="relative group">
               <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
               <input 
                 type="text" 
                 placeholder="Search customers, businesses, orders, or anything..." 
                 className="w-full pl-10 pr-12 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-slate-700"
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                 <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-400 rounded-md">⌘</kbd>
                 <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-400 rounded-md">K</kbd>
               </div>
             </div>
           </div>
           
           <div className="flex items-center gap-5 ml-8">
             <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-50">
               <HelpCircle className="w-5 h-5" />
             </button>
             
             <div className="w-px h-8 bg-slate-200 mx-2"></div>
             
             <div className="flex items-center gap-3 cursor-pointer group">
               <img src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" alt="Admin" className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-100 transition-all" />
               <div className="text-left hidden md:block">
                  <div className="text-sm font-bold text-slate-900 leading-tight">Admin</div>
                  <div className="text-[11px] font-medium text-slate-500">Super Administrator</div>
               </div>
             </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, children, active }: { href: string, icon: any, children: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`}>{icon}</span>
      {children}
    </Link>
  );
}
