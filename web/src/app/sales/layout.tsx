'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users2,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Users,
  CreditCard,
  QrCode,
  CalendarCheck,
  BarChart3,
  UserCheck,
  Palette,
  Settings,
  Search,
  Bell,
  Calendar,
  LogOut,
  Crown,
  Menu,
  X,
} from 'lucide-react';

interface StaffUser {
  role: 'salesperson' | 'sales_manager' | 'admin';
  fullName: string;
  email: string;
  staffId: string;
  isSuperAdmin?: boolean;
}

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkSalesAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=/sales');
          return;
        }

        // Resolve role from the database-backed staff record. Never trust
        // user_metadata or an email-based client-side fallback for access.
        const [meRes, analyticsRes] = await Promise.all([
          fetch('/api/sales/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
          fetch('/api/sales/analytics', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }),
        ]);

        if (meRes.status === 401 || meRes.status === 403) {
          router.push('/dashboard');
          return;
        }

        const meData = await meRes.json();
        const res = analyticsRes;
        await res.json();

        if (!meData.success || !meData.staff) {
          router.push('/dashboard');
          return;
        }

        setCurrentUser(meData.staff);

        if (res.status === 401 || res.status === 403) {
          router.push('/dashboard');
          return;
        }

      } catch (e) {
        console.warn('Sales auth check error:', e);
      } finally {
        setLoading(false);
      }
    }

    checkSalesAuth();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Sales Operations...</p>
        </div>
      </div>
    );
  }

  const roleLabel =
    currentUser?.role === 'admin'
      ? 'Super Admin'
      : currentUser?.role === 'sales_manager'
      ? 'Sales Manager'
      : 'Sales Executive';

  const navItems = [
    { href: '/sales', label: 'Sales Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/sales/leads', label: 'Leads & Prospects', icon: Users2 },
    { href: '/sales/demo-builder', label: 'Demo Builder', icon: Sparkles },
    { href: '/sales/demos', label: 'My Demos', icon: Layers },
    { href: '/sales/conversions', label: 'Conversions', icon: ArrowRightLeft },
    { href: '/sales/customers', label: 'Customers', icon: Users },
    { href: '/sales/orders', label: 'Orders & Payments', icon: CreditCard },
    { href: '/sales/nfc', label: 'NFC & QR Management', icon: QrCode },
    { href: '/sales/tasks', label: 'Follow-ups & Tasks', icon: CalendarCheck },
    { href: '/sales/analytics', label: 'Reports & Analytics', icon: BarChart3 },
    ...(currentUser?.role === 'admin' || currentUser?.role === 'sales_manager'
      ? [{ href: '/sales/team', label: 'Team Management', icon: UserCheck }]
      : []),
    { href: '/sales/templates', label: 'Templates', icon: Palette },
    { href: '/sales/settings', label: 'Settings', icon: Settings },
  ];


  return (
    <div className="flex h-screen bg-[#F4F6F9] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[250px] bg-white border-r border-slate-200/90 flex-col z-30 flex-shrink-0">
        {/* Brand */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center font-black text-white text-base shadow-sm">
            P
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[17px] text-slate-900 tracking-tight leading-tight">
              Pixora Funnel
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider">
              Review • Grow • Repeat
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 scrollbar-hide text-[13px]">
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-[#5356EC] text-white font-semibold shadow-sm shadow-indigo-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Lifetime Access Card */}
        <div className="p-3.5 border-t border-slate-100 space-y-2">
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#2D1B69] via-[#1E1B4B] to-[#171336] text-white shadow-md relative overflow-hidden">
            <div className="flex items-center justify-center mb-2">
              <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-center">
              <h4 className="text-xs font-bold text-white tracking-wide">Lifetime Plans</h4>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">No account cap</p>
            </div>

            <p className="mt-3 text-center text-[10px] text-slate-300 font-semibold">Both lifetime plans are available without an account cap.</p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-18 bg-white border-b border-slate-200/90 px-6 sm:px-8 flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads, customers, demos..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Current data window (the analytics endpoint is server-derived) */}
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:flex">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Last 30 Days</span>
            </div>

            {/* Notification Bell with Badge */}
            <button type="button" aria-label="Notifications" className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4" />
            </button>

            {/* User Profile */}
              <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white ring-2 ring-slate-100" aria-hidden="true">
                {(currentUser?.fullName || 'S').slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.fullName || 'Rahul Sharma'}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">{roleLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <item.icon className="w-4 h-4 text-indigo-600" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-7 bg-[#F4F6F9]">
          {children}
        </main>
      </div>
    </div>
  );
}
