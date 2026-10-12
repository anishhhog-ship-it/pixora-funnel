'use client';

import { Suspense, useEffect, useState } from 'react';
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
  HelpCircle, 
  Share2, 
  Bell,
  ExternalLink,
  ChevronDown,
  PlusCircle,
  Sparkles,
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
  LogOut,
  User as UserIcon,
  X,
  Download,
  Store,
  Key,
  CheckCircle2,
  AlertCircle,
  Search,
  Smartphone,
  ArrowRight,
  BookOpen,
  LifeBuoy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  authService, 
  businessService, 
  trialService, 
  getCatalogTerminology, 
  notificationService, 
  NotificationItem 
} from '@/services';
import { Business } from '@/types';
import PwaInstallPrompt, { triggerPwaInstall } from '@/components/PwaInstallPrompt';

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
  { label: 'Auto Reply', icon: MessageSquare, href: '/dashboard/auto-reply' },
  { label: 'Menu Management', icon: UtensilsCrossed, href: '/dashboard/menu' },
  { label: 'QR Codes', icon: QrCode, href: '/dashboard/qr' },
  { label: 'Analytics', icon: BarChart2, href: '/dashboard/analytics' },
  { label: 'Customers', icon: Users, href: '/dashboard/customers' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

const MOBILE_NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/dashboard' },
  { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
  { label: 'QR Stand', icon: QrCode, href: '/dashboard/qr' },
  { label: 'Menu', icon: UtensilsCrossed, href: '/dashboard/menu' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

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
  const [showBizSwitcher, setShowBizSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  // First-Time Sign-In Phone Number Prompt State
  const [showFirstTimePhoneModal, setShowFirstTimePhoneModal] = useState(false);
  const [firstTimePhoneInput, setFirstTimePhoneInput] = useState('');
  const [firstTimePhoneError, setFirstTimePhoneError] = useState<string | null>(null);
  const [isSavingFirstTimePhone, setIsSavingFirstTimePhone] = useState(false);

  // Dynamic Terminology based on Category from Places API / Business profile
  const terminology = getCatalogTerminology(activeBusiness?.category);
  const CatalogNavIcon = terminology.isFood ? UtensilsCrossed : BookOpen;

  const sidebarItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'Reviews', icon: Star, href: '/dashboard/reviews' },
    { label: 'Auto Reply', icon: MessageSquare, href: '/dashboard/auto-reply' },
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
          setTrialTimeText('Active · 1 Year License Valid');
          setIsTrialExpired(false);
        } else {
          // Update trial timer
          const status = trialService.getRemainingTime(matched.trialExpiresAt);
          setTrialTimeText(`Trial · ${status.text}`);
          setIsTrialExpired(status.isExpired);
        }
        setIsInitializing(false);

        // Fetch notifications from Admin Panel / system
        notificationService.getNotifications(matched.id).then((notifs) => {
          setNotifications(notifs);
          setUnreadNotifCount(notifs.filter(n => !n.read).length);
        });
      } else {
        // User is logged in but hasn't completed onboarding -> direct to setup their 1 business
        router.push('/onboarding');
      }
    });

    // Realtime notification listener
    const unsubscribeNotifs = notificationService.subscribeToNotifications(activeBusiness?.id, (newNotif: NotificationItem) => {
      setNotifications(prev => [newNotif, ...prev.filter(n => n.id !== newNotif.id)]);
      setUnreadNotifCount(prev => prev + 1);
    });

    // Dashboard activation event listener (e.g. key entered in modal)
    const handleActivatedEvent = () => {
      setIsTrialExpired(false);
      setTrialTimeText('Active · 1 Year License Valid');
      setActiveBusiness(prev => prev ? { ...prev, planStatus: 'active' } : null);
    };
    window.addEventListener('pixora:dashboard_activated', handleActivatedEvent);

    // Ticking interval every minute for trial accounts
    const interval = setInterval(() => {
      if (activeBusiness?.trialExpiresAt && activeBusiness.planStatus !== 'active') {
        const status = trialService.getRemainingTime(activeBusiness.trialExpiresAt);
        setTrialTimeText(`Trial · ${status.text}`);
        setIsTrialExpired(status.isExpired);
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      unsubscribeNotifs();
      window.removeEventListener('pixora:dashboard_activated', handleActivatedEvent);
    };
  }, [queryBiz, activeBusiness?.trialExpiresAt, activeBusiness?.id, router]);

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
      setIsTrialExpired(false);
      setTrialTimeText('Active · 1 Year License Valid');
      if (activeBusiness) {
        setActiveBusiness({
          ...activeBusiness,
          planStatus: 'active',
          trialExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      setTimeout(() => {
        setShowUpgradeModal(false);
        setDashboardLicenseKey('');
        setLicenseKeySuccess(null);
      }, 1600);
    } catch (err: any) {
      setLicenseKeyError(err?.message || 'Activation failed. Please contact support.');
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
    } catch (err: any) {
      setActivationError(err?.message || 'Failed to activate key. Please contact support.');
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
    } catch (err: any) {
      setFirstTimePhoneError(err?.message || 'Failed to save phone number. Please try again.');
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
  const primaryColor = activeBusiness?.theme?.primaryColor || '#0B3D2E';
  const secondaryColor = activeBusiness?.theme?.secondaryColor || '#D4AF37';

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

  return (
    <div className="flex h-screen overflow-hidden font-[Inter,sans-serif] bg-slate-50 text-slate-900" suppressHydrationWarning>
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 hidden md:flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300">
        {/* Platform Brand */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/pixora-logo.png"
              alt="Pixora Funnel"
              width={180}
              height={48}
              className="h-8 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const href = queryBiz ? `${item.href}?business=${queryBiz}` : item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon 
                  className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-blue-600" : "text-slate-400")}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Pinned Bottom Nav Option */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <Link
            href={queryBiz ? `/dashboard/support?business=${queryBiz}` : '/dashboard/support'}
            className={cn(
              'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
              pathname === '/dashboard/support'
                ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
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
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>24/7</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top 1-Day Trial / Active License Strip */}
        <div className="bg-slate-900 px-6 py-2 text-white flex items-center justify-between text-xs border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 truncate mr-3">
            {activeBusiness?.planStatus === 'active' ? (
              <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>1-Year Plan Active</span>
              </span>
            ) : (
              <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1.5 shrink-0">
                <Clock className="w-3 h-3 text-blue-400" />
                <span>{trialTimeText}</span>
              </span>
            )}

            <span className="text-slate-300 truncate hidden sm:inline text-xs">
              {activeBusiness?.planStatus === 'active'
                ? 'Full 1-year software license active. Customer QR review funnel and 24/7 AI Auto-Replies are running.'
                : 'Full feature trial active. Customer QR table scans and Google auto-replies are live.'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeBusiness?.planStatus === 'active' ? (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-transform hover:scale-105 shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Account Active ✓</span>
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-transform hover:scale-105 shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Key className="w-3 h-3 text-amber-300" />
                <span>Activate Plan / License Key →</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Header */}
        <header className="bg-white flex items-center justify-between px-6 py-4 shrink-0 border-b border-slate-200">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Action Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Upgrade Plan
              </button>
            </div>

            {/* View Live Funnel Button */}
            <a
              href={`/f/${bizSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Live Funnel</span>
              <span className="sm:hidden">Funnel</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {/* Business Switcher Dropdown */}
            <div className="relative border-l border-slate-200 pl-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowBizSwitcher(!showBizSwitcher);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-3 text-left hover:bg-slate-50 p-1.5 rounded-lg transition"
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
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
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
                            window.location.href = `/dashboard?business=${b.slug}`;
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
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
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
                className="relative w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-xs hover:bg-gray-50 transition-colors cursor-pointer"
                title="Notifications from Admin Panel"
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
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 lg:p-8 pb-28 md:pb-8">
          {children}
        </main>

        {/* Mobile Client App Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-2 pb-safe shadow-[0_-6px_20px_rgba(0,0,0,0.06)] flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const href = queryBiz ? `${item.href}?business=${queryBiz}` : item.href;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all',
                  isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                )}
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
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Choose Your 1-Year Active Plan
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
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">1 Year Only</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹2,599</span>
                    <span className="text-xs text-slate-500 font-semibold">/ 1 Year</span>
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
                      <span>1 Year Software License</span>
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

                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I would like to activate the ₹2,599 1-Year Plan (Without NFC Card) for ${bizName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Activate 1-Year Plan (₹2,599)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
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

                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I would like to claim the ₹2,999 Lifetime Free Access Plan (First 100 Accounts Offer + NFC Review Card) for ${bizName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span>Claim Lifetime with NFC Card (₹2,999)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[92vh] overflow-y-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setShowAddBusinessModal(false);
                setActivationError(null);
                setActivationSuccess(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
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

      {/* First-Time Sign-In Phone Prompt Modal */}
      {showFirstTimePhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={handleDismissFirstTimePhone}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
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
