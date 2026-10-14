'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  Home, 
  Star, 
  MessageSquare, 
  UtensilsCrossed, 
  QrCode, 
  BarChart2, 
  Users, 
  Settings, 
  Crown, 
  Bell,
  ExternalLink,
  ChevronDown,
  PlusCircle,
  Sparkles,
  Check,
  ShieldCheck,
  Clock,
  LogOut,
  User as UserIcon,
  X,
  Store,
  Key,
  CheckCircle2,
  AlertCircle,
  Search,
  Smartphone,
  ArrowRight,
  BookOpen,
  LifeBuoy,
  Menu as MenuIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PORTAL_FOCUS_RING } from '@/components/client-portal/PortalUI';
import { 
  authService, 
  businessService, 
  trialService, 
  getCatalogTerminology, 
  notificationService, 
  NotificationItem 
} from '@/services';
import { Business } from '@/types';
import PaymentGatewayModal from '@/components/payment/PaymentGatewayModal';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function CreditCard({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function PageTitle(pathname: string, businessName: string) {
  const map: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { 
      title: `Good Morning, ${businessName} 👋`, 
      subtitle: "Here's how your Google review system is performing." 
    },
    '/dashboard/reviews': { 
      title: 'Reviews', 
      subtitle: 'Manage and respond to all your Google reviews in one place.' 
    },
    '/dashboard/auto-reply': { 
      title: 'Auto Reply', 
      subtitle: 'Let AI handle routine replies while you focus on your business.' 
    },
    '/dashboard/menu': { 
      title: 'Menu Management', 
      subtitle: 'Edit and manage your business catalog & menu instantly.' 
    },
    '/dashboard/qr': { 
      title: 'QR Codes', 
      subtitle: 'Create and download print-ready QR table stands & stands.' 
    },
    '/dashboard/analytics': { 
      title: 'Analytics', 
      subtitle: 'Track review velocity, QR scans, customer actions and ratings.' 
    },
    '/dashboard/customers': { 
      title: 'Customers', 
      subtitle: 'Manage your customer database and loyalty program.' 
    },
    '/dashboard/settings': { 
      title: 'Settings', 
      subtitle: 'Manage your profile, brand theme, hours and integrations.' 
    },
    '/dashboard/support': { 
      title: 'Client Support & Helpdesk', 
      subtitle: '24/7 dedicated assistance for NFC cards, Google reviews, and technical setup.' 
    },
  };
  return map[pathname] || { title: 'Dashboard', subtitle: '' };
}

export default function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryBiz = searchParams.get('business');

  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [noBusinessAttached, setNoBusinessAttached] = useState(false);
  const [showBizSwitcher, setShowBizSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gatewayPlan, setGatewayPlan] = useState({
    planId: 'plan_2year_software',
    planName: 'Standard 2-Year Plan',
    amount: 2599,
  });

  // Live Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Additional Shop Account Modal State
  const [showAddBusinessModal, setShowAddBusinessModal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [isActivatingCode, setIsActivatingCode] = useState(false);

  // Dashboard License Key Activation State
  const [dashboardLicenseKey, setDashboardLicenseKey] = useState('');
  const [licenseKeyError, setLicenseKeyError] = useState<string | null>(null);
  const [licenseKeySuccess, setLicenseKeySuccess] = useState<string | null>(null);
  const [isActivatingDashboardKey, setIsActivatingDashboardKey] = useState(false);

  // Live Trial Countdown State
  const [trialTimeText, setTrialTimeText] = useState('Trial · 18h 42m remaining');

  // First-Time Sign-In Phone Number Prompt State
  const [showFirstTimePhoneModal, setShowFirstTimePhoneModal] = useState(false);
  const [firstTimePhoneInput, setFirstTimePhoneInput] = useState('');
  const [firstTimePhoneError, setFirstTimePhoneError] = useState<string | null>(null);
  const [isSavingFirstTimePhone, setIsSavingFirstTimePhone] = useState(false);

  // Dynamic Terminology based on Category from Places API / Business profile
  const terminology = getCatalogTerminology(activeBusiness?.category);
  const CatalogNavIcon = terminology.isFood ? UtensilsCrossed : BookOpen;

  const sidebarItems: Array<{ label: string; icon: any; href: string; badge?: string }> = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
    { label: 'Auto Reply', icon: MessageSquare, href: '/dashboard/auto-reply', badge: 'Beta' },
    { label: terminology.sidebarLabel, icon: CatalogNavIcon, href: '/dashboard/menu' },
    { label: 'QR Codes', icon: QrCode, href: '/dashboard/qr' },
    { label: 'Analytics', icon: BarChart2, href: '/dashboard/analytics' },
    { label: 'Customers', icon: Users, href: '/dashboard/customers' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  const mobileNavItems = [
    { label: 'Home', icon: Home, href: '/dashboard' },
    { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
    { label: 'QR Stand', icon: QrCode, href: '/dashboard/qr' },
    { label: terminology.mobileNavLabel, icon: CatalogNavIcon, href: '/dashboard/menu' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  useEffect(() => {
    // 1. Mandatory Auth Guard: Users MUST be logged in to view Dashboard
    if (!authService.isAuthenticated()) {
      router.replace('/login?redirect=/dashboard');
      return;
    }

    // Sync session user from Supabase (e.g. Google OAuth sign-in)
    authService.syncSessionUser().then((synced) => {
      const user = synced || authService.getCurrentUser();
      if (!user) {
        router.replace('/login?redirect=/dashboard');
        return;
      }

      // If user signed in without a phone number on profile, prompt them on first sign-in
      if (!user.phone || user.phone.trim() === '') {
        const dismissed = typeof window !== 'undefined' && sessionStorage.getItem('pixora_first_phone_dismissed');
        if (!dismissed) {
          setShowFirstTimePhoneModal(true);
        }
      }
    });

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.replace('/login?redirect=/dashboard');
      return;
    }

    // 2. Clean up any anonymous orphan test businesses from previous unauthenticated runs
    businessService.cleanOrphanTestBusinesses(currentUser.id);

    // 3. Load strictly the businesses owned by this logged-in user
    businessService.getBusinessesForUser(currentUser.id).then((userBizs) => {
      setAllBusinesses(userBizs);

      if (userBizs.length > 0) {
        const slug = queryBiz || businessService.getActiveBusinessSlug();
        const matched = userBizs.find((b) => b.slug === slug) || userBizs[0];
        setActiveBusiness(matched);
        businessService.setActiveBusinessSlug(matched.slug);

        // Check if plan is already active (via Supabase or local storage key)
        const isLocallyActive = typeof window !== 'undefined' && (
          localStorage.getItem(`pixora_plan_active_${matched.id}`) === 'true' ||
          localStorage.getItem(`pixora_plan_active_${matched.businessId}`) === 'true' ||
          localStorage.getItem(`pixora_plan_active_${matched.slug}`) === 'true'
        );
        const isPlanActive = matched.planStatus === 'active' || isLocallyActive;

        if (isPlanActive) {
          matched.planStatus = 'active';
          setTrialTimeText('Active · 2 Year License Valid');
        } else {
          // Update trial timer
          const status = trialService.getRemainingTime(matched.trialExpiresAt);
          setTrialTimeText(`Trial · ${status.text}`);
        }
        setIsInitializing(false);

        // Fetch notifications from Admin Panel / system
        notificationService.getNotifications(matched.id).then((notifs) => {
          setNotifications(notifs);
          setUnreadNotifCount(notifs.filter(n => !n.read).length);
        });
      } else {
        // Fallback auto-provision check via authoritative /api/user/businesses
        (async () => {
          try {
            const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
            const client = getSupabaseBrowserClient();
            const { data: { session } } = await client.auth.getSession();
            if (session?.access_token) {
              const res = await fetch('/api/user/businesses', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
              });
              if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.businesses) && json.businesses.length > 0) {
                  const b = json.businesses[0];
                  setAllBusinesses(json.businesses);
                  setActiveBusiness(b);
                  businessService.setActiveBusinessSlug(b.slug);
                  setTrialTimeText('Active · 2 Year License Valid');
                  setIsInitializing(false);
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('Dashboard fallback provision error:', e);
          }
          setIsInitializing(false);
          setNoBusinessAttached(true);
        })();
      }
    });

    // Realtime notification listener
    const unsubscribeNotifs = notificationService.subscribeToNotifications(activeBusiness?.id, (newNotif: NotificationItem) => {
      setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      setUnreadNotifCount(prev => prev + 1);
    });

    // Dashboard activation event listener (e.g. key entered in modal)
    const handleActivatedEvent = () => {
      setTrialTimeText('Active · 2 Year License Valid');
      setActiveBusiness(prev => prev ? { ...prev, planStatus: 'active' } : null);
    };
    window.addEventListener('pixora:dashboard_activated', handleActivatedEvent);

    // Ticking interval every minute for trial accounts
    const interval = setInterval(() => {
      if (activeBusiness?.trialExpiresAt && activeBusiness.planStatus !== 'active') {
        const status = trialService.getRemainingTime(activeBusiness.trialExpiresAt);
        setTrialTimeText(`Trial · ${status.text}`);
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      unsubscribeNotifs();
      window.removeEventListener('pixora:dashboard_activated', handleActivatedEvent);
    };
  }, [queryBiz, activeBusiness?.trialExpiresAt, activeBusiness?.id, activeBusiness?.planStatus, router]);

  const handleActivateDashboardLicense = async () => {
    const key = dashboardLicenseKey.trim().toUpperCase();
    if (!key) {
      setLicenseKeyError('Please enter your license key.');
      return;
    }
    const bizId = activeBusiness?.businessId || activeBusiness?.id || activeBusiness?.slug || await businessService.getActiveBusinessId();
    setIsActivatingDashboardKey(true);
    setLicenseKeyError(null);
    setLicenseKeySuccess(null);

    try {
      const res = await businessService.activateDashboardWithLicenseKey(bizId, key);
      if (!res.success) {
        setLicenseKeyError(res.message);
        return;
      }
      setLicenseKeySuccess(res.message);
      setTrialTimeText('Active · 2 Year License Valid');
      if (activeBusiness) {
        setActiveBusiness({
          ...activeBusiness,
          planStatus: 'active',
          trialExpiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      setTimeout(() => {
        setShowUpgradeModal(false);
        setDashboardLicenseKey('');
        setLicenseKeySuccess(null);
      }, 1600);
     } catch (err: unknown) {
      setLicenseKeyError(getErrorMessage(err, 'Activation failed. Please contact support.'));
    } finally {
      setIsActivatingDashboardKey(false);
    }
  };

  const handleActivateLicenseCode = async () => {
    const code = activationCode.trim().toUpperCase();
    if (!code) {
      setActivationError('Please enter an activation license key.');
      return;
    }
    setIsActivatingCode(true);
    setActivationError(null);

    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) throw new Error('Please log in first.');

      // Validates outlet activation keys (e.g. PIXORA-OUTLET-2025 or any 6+ alphanumeric code)
      if (code.length < 6) {
        setActivationError('Invalid activation key. Must be at least 6 characters.');
        return;
      }

      // Unlock an additional business location slot
      businessService.activateAdditionalBusinessSlot(currentUser.id, 1);
      setActivationSuccess('✓ Additional shop account license activated! Redirecting to setup...');
      setTimeout(() => {
        setShowAddBusinessModal(false);
        router.push('/onboarding?mode=add_location');
      }, 1200);
     } catch (err: unknown) {
       setActivationError(getErrorMessage(err, 'Failed to activate key. Please contact support.'));
    } finally {
      setIsActivatingCode(false);
    }
  };

  const handleAddNewBusinessClick = async () => {
    setShowBizSwitcher(false);
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    const check = await businessService.canUserAddBusiness(currentUser.id);
    if (!check.allowed) {
      setActivationError(null);
      setActivationSuccess(null);
      setActivationCode('');
      setShowAddBusinessModal(true);
    } else {
      router.push('/onboarding?mode=add_location');
    }
  };

  const handleSaveFirstTimePhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = firstTimePhoneInput.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setFirstTimePhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const formattedPhone = cleanDigits.length === 10 ? `+91 ${cleanDigits}` : `+${cleanDigits}`;
    setIsSavingFirstTimePhone(true);
    setFirstTimePhoneError(null);

    try {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        await authService.updateUserPhone(currentUser.id, formattedPhone);
      }

      if (activeBusiness) {
        const updatedBiz = await businessService.createOrUpdateBusiness({
          ...activeBusiness,
          phone: formattedPhone
        });
        if (updatedBiz) {
          setActiveBusiness(updatedBiz);
        }
      }

      setShowFirstTimePhoneModal(false);
     } catch (err: unknown) {
       setFirstTimePhoneError(getErrorMessage(err, 'Failed to save phone number. Please try again.'));
    } finally {
      setIsSavingFirstTimePhone(false);
    }
  };

  const handleDismissFirstTimePhone = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pixora_first_phone_dismissed', 'true');
    }
    setShowFirstTimePhoneModal(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push('/login');
  };

  const bizName = activeBusiness?.name || 'Your Business';
  const bizCategory = activeBusiness?.category || 'Pure Veg Restaurant';
  const bizSlug = activeBusiness?.slug || 'your-business';
  const { title, subtitle } = PageTitle(pathname, bizName);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'P';
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center" suppressHydrationWarning>
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Dashboard...</p>
      </div>
    );
  }

  if (noBusinessAttached) {
    const currentUser = authService.getCurrentUser();
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            No business profile attached to this email
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {currentUser?.email ? (
              <>The email <strong className="text-slate-800 font-semibold">{currentUser.email}</strong> does not have an active business profile listed yet.</>
            ) : (
              'No business profile attached to this email.'
            )}
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/onboarding"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
            >
              <span>Create Business Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Sign out / Use another email
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLocallyActive = typeof window !== 'undefined' && activeBusiness && (
    localStorage.getItem(`pixora_plan_active_${activeBusiness.id}`) === 'true' ||
    localStorage.getItem(`pixora_plan_active_${activeBusiness.businessId}`) === 'true' ||
    localStorage.getItem(`pixora_plan_active_${activeBusiness.slug}`) === 'true'
  );
  const isAccountUpgraded = activeBusiness?.planStatus === 'active' || Boolean(isLocallyActive);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-[Inter,sans-serif] text-slate-900" suppressHydrationWarning>
      {/* Sidebar */}
      <aside className="hidden h-full w-[272px] flex-shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex">
        {/* Platform Brand */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <Link href="/" className={cn('group flex items-center gap-2', PORTAL_FOCUS_RING)} aria-label="Pixora home">
            <Image
              src="/pixora-logo.png"
              alt="Pixora Funnel"
              width={180}
              height={48}
              className="h-8 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </Link>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Portal
          </span>
        </div>

        {/* Nav Links */}
        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-6" aria-label="Client portal navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const href = queryBiz ? `${item.href}?business=${queryBiz}` : item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'border-blue-100 bg-blue-50 text-blue-700 shadow-[0_8px_18px_-14px_rgba(37,99,235,0.8)]'
                    : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950',
                  PORTAL_FOCUS_RING,
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors', isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')}
                />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-purple-100 text-purple-700 border border-purple-200/80 uppercase tracking-wider">
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Pinned Bottom Nav Option */}
        <div className="border-t border-slate-100 bg-white p-4">
          <Link
            href={queryBiz ? `/dashboard/support?business=${queryBiz}` : '/dashboard/support'}
            className={cn(
              'group flex items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-medium transition-all',
              pathname === '/dashboard/support'
                ? 'border-blue-100 bg-blue-50 font-semibold text-blue-700 shadow-2xs'
                : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900',
              PORTAL_FOCUS_RING,
            )}
            aria-current={pathname === '/dashboard/support' ? 'page' : undefined}
          >
            <div className="flex items-center gap-3 truncate">
              <LifeBuoy
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  pathname === '/dashboard/support' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'
                )}
              />
              <span className="truncate">Client Support</span>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>24/7</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Mobile navigation drawer */}
      {showMobileNav && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-slate-950/35 md:hidden"
            onClick={() => setShowMobileNav(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col border-r border-slate-200 bg-white shadow-2xl md:hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <Link
                href={queryBiz ? `/dashboard?business=${queryBiz}` : '/dashboard'}
                onClick={() => setShowMobileNav(false)}
                className={cn('flex items-center gap-2', PORTAL_FOCUS_RING)}
                aria-label="Go to dashboard home"
              >
                <Image src="/pixora-logo.png" alt="Pixora Funnel" width={150} height={40} className="h-7 w-auto object-contain" />
              </Link>
              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className={cn('rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900', PORTAL_FOCUS_RING)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Mobile client portal navigation">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const href = queryBiz ? `${item.href}?business=${queryBiz}` : item.href;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setShowMobileNav(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm font-medium transition',
                      isActive ? 'border-blue-100 bg-blue-50 font-semibold text-blue-700' : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50',
                      PORTAL_FOCUS_RING,
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-slate-400')} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-purple-100 text-purple-700 border border-purple-200/80 uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 p-4">
              <Link
                href={queryBiz ? `/dashboard/support?business=${queryBiz}` : '/dashboard/support'}
                onClick={() => setShowMobileNav(false)}
                className={cn('flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-700', PORTAL_FOCUS_RING)}
              >
                <LifeBuoy className="h-5 w-5 text-blue-600" />
                <span>Client Support</span>
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* Main Container */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top 1-Day Trial Strip (hidden after account activation) */}
        {!isAccountUpgraded && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white sm:px-6">
            <div className="mr-3 flex min-w-0 items-center gap-2.5 truncate">
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-600/30 px-2.5 py-0.5 text-[11px] font-bold text-blue-300">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>{trialTimeText}</span>
              </span>

              <span className="hidden truncate text-xs text-slate-300 xl:inline">
                Full feature trial active. Customer QR table scans and Google auto-replies are live.
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className={cn('flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 sm:px-3', PORTAL_FOCUS_RING)}
                aria-label="Activate plan or enter license key"
              >
                <Key className="w-3 h-3 text-amber-300" />
                <span className="hidden sm:inline">Activate Plan / License Key</span>
                <span className="sm:hidden">Activate</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-4" aria-label="Client portal header">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:max-w-md">
            <button
              type="button"
              onClick={() => setShowMobileNav(true)}
              className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-950 md:hidden', PORTAL_FOCUS_RING)}
              aria-label="Open navigation menu"
              aria-expanded={showMobileNav}
            >
              <MenuIcon />
            </button>
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-sm font-bold text-slate-950">{title}</p>
              <p className="truncate text-[10px] text-slate-500">{subtitle || 'Client portal'}</p>
            </div>
            <div className="relative hidden w-full lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                aria-label="Search client portal"
                className={cn('w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white', PORTAL_FOCUS_RING)}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Action Buttons: Automatically hidden when upgraded */}
            {!isAccountUpgraded ? (
              <div className="hidden sm:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className={cn('rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100', PORTAL_FOCUS_RING)}
                >
                  Upgrade Plan
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Active (2 Years)</span>
              </div>
            )}

            {/* View Live Funnel Button */}
            <a
              href={`/f/${bizSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs font-semibold text-blue-700 shadow-2xs transition-colors hover:bg-blue-100 sm:px-3.5', PORTAL_FOCUS_RING)}
              aria-label="Open live customer funnel in a new tab"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Live Funnel</span>
              <span className="sm:hidden">Funnel</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Business Switcher Dropdown */}
            <div className="relative flex items-center gap-2 border-l border-slate-200 pl-2 sm:gap-3 sm:pl-4">
              <button
                type="button"
                onClick={() => {
                  setShowBizSwitcher(!showBizSwitcher);
                  setShowUserMenu(false);
                }}
                className={cn('flex items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-slate-50 sm:gap-3', PORTAL_FOCUS_RING)}
                aria-label={`Switch business. Current business: ${bizName}`}
                aria-expanded={showBizSwitcher}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {activeBusiness?.logo ? (
                    <img src={activeBusiness.logo} alt={bizName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-600 font-bold text-xs">{getInitials(bizName)}</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">{bizName}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Owner</p>
                </div>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', showBizSwitcher && 'rotate-180 text-blue-600')} />
              </button>

              {showBizSwitcher && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Active Business</p>
                    <p className="text-xs font-bold text-gray-900 truncate">{bizName}</p>
                    <p className="text-[10px] text-gray-500 truncate">{bizCategory}</p>
                  </div>

                  <div className="max-h-48 overflow-y-auto py-1">
                    <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase">Switch Business</p>
                    {allBusinesses.map((b) => {
                      const isCurr = b.slug === bizSlug;
                      return (
                        <button
                          key={b.slug}
                          type="button"
                          onClick={() => {
                            setActiveBusiness(b);
                            businessService.setActiveBusinessSlug(b.slug);
                            setShowBizSwitcher(false);
                             router.push(`/dashboard?business=${b.slug}`);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors',
                            isCurr ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-gray-700'
                          )}
                        >
                          <span className="truncate">{b.name}</span>
                          {isCurr && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleAddNewBusinessClick}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Add Another Business</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Account Menu (Required: Business Name, Client Portal, Account Settings, Logout) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowBizSwitcher(false);
                }}
                className={cn('flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200', PORTAL_FOCUS_RING)}
                aria-label="Open account menu"
                aria-expanded={showUserMenu}
              >
                <UserIcon className="w-4 h-4" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{bizName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">funnel.pixoraautomations.com</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Home className="w-3.5 h-3.5 text-blue-600" />
                      <span>Client Portal</span>
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      href="/dashboard/support"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
                      <span>Support &amp; Helpdesk</span>
                    </Link>

                    <a
                      href={`/f/${bizSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Live Customer Funnel</span>
                    </a>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell with Admin Panel Broadcasts */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                  setShowBizSwitcher(false);
                }}
                className={cn('relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xs transition-colors hover:bg-slate-50', PORTAL_FOCUS_RING)}
                title="Notifications from Admin Panel"
                aria-label={unreadNotifCount > 0 ? `Notifications, ${unreadNotifCount} unread` : 'Notifications'}
                aria-expanded={showNotifications}
              >
                <Bell className="w-4 h-4 text-gray-600" />
                {unreadNotifCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">Admin Broadcasts &amp; Alerts</p>
                      {unreadNotifCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {unreadNotifCount} new
                        </span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          await notificationService.markAllAsRead(activeBusiness?.id);
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                          setUnreadNotifCount(0);
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No notifications yet</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Announcements from the admin panel and review alerts will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const typeBadge = {
                          admin_broadcast: { label: 'Admin Broadcast', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                          ticket_reply: { label: 'Support Reply', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                          system: { label: 'System Alert', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                          review: { label: 'Review Activity', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                          trial: { label: 'Plan Status', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                        }[notif.type] || { label: 'Notification', color: 'bg-slate-50 text-slate-700 border-slate-200' };

                        return (
                          <div
                            key={notif.id}
                            onClick={async () => {
                              if (!notif.read) {
                                await notificationService.markAsRead(notif.id);
                                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                setUnreadNotifCount(prev => Math.max(0, prev - 1));
                              }
                              if (notif.link) {
                                setShowNotifications(false);
                                router.push(notif.link);
                              }
                            }}
                            className={cn(
                              'p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3',
                              !notif.read ? 'bg-blue-50/40' : 'bg-white'
                            )}
                          >
                            <div className="mt-1 shrink-0">
                              {!notif.read ? (
                                <span className="w-2 h-2 rounded-full bg-blue-600 block ring-4 ring-blue-100" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300 block" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', typeBadge.color)}>
                                  {typeBadge.label}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className={cn('text-xs text-slate-900 leading-snug', !notif.read ? 'font-bold' : 'font-medium')}>
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between px-3">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Connected to Admin Feed</span>
                    </span>
                    <Link
                      href="/dashboard/support"
                      onClick={() => setShowNotifications(false)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Support Center →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50/80 p-3.5 pb-28 sm:p-6 lg:p-8 lg:pb-8">
          <div className="mx-auto mb-5 flex w-full max-w-[1600px] items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.55)] backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-slate-400">
              <span className="shrink-0 uppercase tracking-[0.16em] text-blue-600">Workspace</span>
              <span aria-hidden="true">/</span>
              <span className="truncate text-slate-700">{pathname === '/dashboard' ? 'Overview' : title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[10px] font-semibold text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" aria-hidden="true" />
              <span className="hidden sm:inline">Active business</span>
              <span className="max-w-[120px] truncate text-slate-800 sm:max-w-[180px]">{bizName}</span>
            </div>
          </div>
          {children}
        </main>

        {/* Mobile Client App Bottom Tab Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 pb-safe shadow-[0_-6px_20px_rgba(0,0,0,0.06)] md:hidden" aria-label="Mobile client portal navigation">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const href = queryBiz ? `${item.href}?business=${queryBiz}` : item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-all',
                  isActive ? 'font-semibold text-blue-600' : 'text-slate-500 hover:text-slate-800',
                  PORTAL_FOCUS_RING,
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div 
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all',
                    isActive ? 'bg-blue-50' : 'bg-transparent'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] leading-tight truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* PWA Chrome Install Prompt & iOS Guide for Dashboard */}
        <PwaInstallPrompt source="dashboard" businessName={bizName} />
      </div>

      {/* Upgrade / Active Plan Selection Modal */}
      {showUpgradeModal && !isAccountUpgraded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl no-scrollbar sm:p-8" role="dialog" aria-modal="true" aria-labelledby="upgrade-plan-title">
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              className={cn('absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700', PORTAL_FOCUS_RING)}
              aria-label="Close plan options"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <h3 id="upgrade-plan-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
                Choose Your 2-Year Active Plan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Turn on the <strong>AI Auto Reply System</strong>, keep your branded QR funnel live, and accelerate 5-star Google reviews.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Option 1: 2,599 Without NFC */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plan 1 · Software</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">2 Years Validity</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹2,599</span>
                    <span className="text-xs text-slate-500 font-semibold">/ 2 Years</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mb-3">
                    Without NFC Card · Full Software Suite
                  </p>

                  <div className="text-xs text-slate-600 space-y-2 mb-5">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Reply System Activated</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full QR Review Funnel Software</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>2 Years Software License</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Scan Analytics & Digital Menu</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>✕ Without physical NFC card</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setGatewayPlan({
                      planId: 'plan_2year_software',
                      planName: 'Standard 2-Year Plan',
                      amount: 2599,
                    });
                    setShowGatewayModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pay & Activate Online (₹2,599)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Option 2: 2,999 With NFC */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border-2 border-blue-600 flex flex-col justify-between relative shadow-sm">
                <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  🔥 Lifetime Deal · First 100
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Plan 2 · Software + NFC</span>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">Lifetime Free</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-blue-900">₹2,999</span>
                    <span className="text-xs text-blue-700 font-bold">/ Lifetime Free</span>
                  </div>
                  <p className="text-xs font-semibold text-blue-700 mb-2">
                    First 100 Accounts: Lifetime Free Access + NFC Card
                  </p>

                  {/* NFC Review Card Mockup Image */}
                  <div className="relative w-full h-28 my-2 rounded-xl overflow-hidden border border-blue-200">
                    <Image
                      src="/products/nfc-review-card.jpg"
                      alt="NFC Review Card"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-amber-300" />
                        <span>NFC Smart Tap Review Card Included</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1.5 mb-4">
                    <div className="flex items-center gap-1.5 text-blue-950 font-bold">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>First 100 Accounts: Lifetime Free Access</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-950 font-medium">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Custom NFC Review Card Included</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Reply System Activated for Life</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Zero Annual Renewal Fees Forever</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Free Express Doorstep Delivery</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setGatewayPlan({
                      planId: 'plan_pro_nfc_lifetime',
                      planName: 'Pro Plan + NFC Card (Lifetime Offer)',
                      amount: 2999,
                    });
                    setShowGatewayModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Claim & Pay Online (₹2,999)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Instant License Key Activation Container */}
            <div className="mb-5 p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/60 rounded-2xl border border-blue-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <Key className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Already Have an Activation License Key?
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mb-3 leading-relaxed">
                If the admin or sales team provided you with an activation license key, enter it below to activate your dashboard instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={dashboardLicenseKey}
                  onChange={(e) => {
                    setDashboardLicenseKey(e.target.value);
                    setLicenseKeyError(null);
                  }}
                  placeholder="e.g. PX-XXXX-XXXX or PIXORA-..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleActivateDashboardLicense}
                  disabled={isActivatingDashboardKey || !dashboardLicenseKey.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                >
                  {isActivatingDashboardKey ? 'Activating...' : 'Activate Dashboard Instantly'}
                </button>
              </div>

              {licenseKeyError && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{licenseKeyError}</span>
                </div>
              )}

              {licenseKeySuccess && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{licenseKeySuccess}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-1">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Continue Exploring 1-Day Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Additional Shop / Business Account Modal */}
      {showAddBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl no-scrollbar sm:p-8" role="dialog" aria-modal="true" aria-labelledby="add-business-title">
            <button
              type="button"
              onClick={() => {
                setShowAddBusinessModal(false);
                setActivationError(null);
                setActivationSuccess(null);
              }}
              className={cn('absolute right-5 top-5 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700', PORTAL_FOCUS_RING)}
              aria-label="Close add business dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-13 h-13 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-xs">
                <Store className="w-7 h-7 text-amber-600" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>1 Account = 1 Business Location</span>
              </div>
              <h3 id="add-business-title" className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Activate Additional Shop Account
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Your standard account includes 1 active business profile. To connect and manage another store or branch in this same dashboard, activate an additional shop license.
              </p>
            </div>

            {/* Why each business needs an independent profile */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5 space-y-2.5">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                What each additional shop receives:
              </p>
              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Dedicated QR Table Stands</strong> with independent review routing & Google Maps link</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Separate AI Auto-Reply</strong> responses tailored specifically to this location</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Unique Digital Catalog / Menu</strong> with outlet-specific pricing & WhatsApp orders</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Single Dashboard Control:</strong> Switch between all your outlets with 1 click without re-logging in</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Lifetime Plan per Shop</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">No Monthly Recurring Fees</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through mr-1.5 font-medium decoration-rose-500 decoration-1">
                    ₹5,999
                  </span>
                  <span className="text-2xl font-black text-slate-900">₹2,599</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Purchase CTA */}
            <div className="space-y-3 mb-5">
              <a
                href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I would like to purchase an Additional Shop / Branch Account (₹2,599 Lifetime License) for my dashboard (${authService.getCurrentUser()?.email || 'my account'}). Please share the activation key.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Activate on WhatsApp (₹2,599)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-[11px] text-center text-slate-400">
                Instant delivery of activation license key on WhatsApp within 2 minutes.
              </p>
            </div>

            {/* License Key Activation Input */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Already have an Activation License Key?</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => {
                    setActivationCode(e.target.value);
                    setActivationError(null);
                  }}
                  placeholder="e.g. PIXORA-OUTLET-XXXX"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleActivateLicenseCode}
                  disabled={isActivatingCode}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isActivatingCode ? 'Verifying...' : 'Unlock Shop'}
                </button>
              </div>

              {activationError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{activationError}</span>
                </div>
              )}

              {activationSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{activationSuccess}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        planId={gatewayPlan.planId}
        planName={gatewayPlan.planName}
        amount={gatewayPlan.amount}
        businessId={activeBusiness?.businessId || activeBusiness?.id || 'active'}
        businessName={bizName}
        onSuccess={() => {
          setActiveBusiness((prev) => (prev ? { ...prev, planStatus: 'active' } : null));
          setTrialTimeText('Active · 2 Year License Valid');
        }}
      />

      {/* First-Time Sign-In Phone Prompt Modal */}
      {showFirstTimePhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="phone-setup-title">
            <button
              type="button"
              onClick={handleDismissFirstTimePhone}
              className={cn('absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700', PORTAL_FOCUS_RING)}
              aria-label="Close phone setup dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
                <Smartphone className="w-7 h-7 text-emerald-700" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200/70 mb-2">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Account Setup</span>
              </span>
              <h3 id="phone-setup-title" className="text-xl font-bold tracking-tight text-slate-900">
                Enter Your Phone Number
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Add your WhatsApp or mobile number to receive instant review notifications and connect your smart QR stand.
              </p>
            </div>

            <form onSubmit={handleSaveFirstTimePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-xl border border-slate-300 focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/20 overflow-hidden bg-slate-50">
                  <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-slate-300 text-xs font-bold text-slate-700 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    autoFocus
                    value={firstTimePhoneInput}
                    onChange={(e) => {
                      setFirstTimePhoneInput(e.target.value);
                      if (firstTimePhoneError) setFirstTimePhoneError(null);
                    }}
                    placeholder="98765 43210"
                    maxLength={14}
                    className="flex-1 px-3.5 py-2.5 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Used for review alerts and business communication.</p>
              </div>

              {firstTimePhoneError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{firstTimePhoneError}</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isSavingFirstTimePhone || !firstTimePhoneInput.trim()}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  {isSavingFirstTimePhone ? (
                    <span>Saving Phone Number...</span>
                  ) : (
                    <>
                      <span>Save &amp; Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDismissFirstTimePhone}
                  className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  I&apos;ll do this later
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
