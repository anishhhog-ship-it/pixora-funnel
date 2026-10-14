'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Eye, 
  Check, 
  ExternalLink, 
  Palette, 
  Layers, 
  Type, 
  ImageIcon, 
  Smartphone, 
  Store, 
  TrendingUp, 
  Bot, 
  Zap, 
  Clock, 
  Star,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Link2, 
  ShieldCheck, 
  AlertTriangle,
  AlertCircle,
  X,
  Bell,
  BellRing,
  Copy,
  CreditCard,
  Download,
  Globe,
  Key,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Volume2,
  Calendar,
  FileText,
  ArrowRight,
  CheckCircle,
  User as UserIcon,
  ShieldAlert,
  Search,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoogleConnectionBadge } from '@/components/GoogleConnectionBadge';

import { 
  authService,
  businessService, 
  googleBusinessProfileService,
  GoogleConnectionInfo,
  GoogleBusinessAccount,
  GoogleBusinessLocation,
  googlePlacesService,
  GoogleBusinessDetails,
  notificationService,
  NotificationItem,
  getAllCategories, 
  normalizeBusinessCategory, 
  isFoodAndDiningBusiness,
  BUSINESS_CATEGORIES, 
  DEFAULT_FUNNEL_BACKGROUND,
  BusinessCategoryConfig,
  OverlayType,
  FontStyle
} from '@/services';
import { Business, User } from '@/types';
import { PortalErrorState, PortalLoadingState } from '@/components/client-portal/PortalUI';

function InstagramIcon({ className = "w-4 h-4 text-pink-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4 text-blue-600" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function YoutubeIcon({ className = "w-4 h-4 text-red-500" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43zM9.75 15.02l5.75-3.27-5.75-3.27v6.54z"/>
    </svg>
  );
}

export interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  is24Hours: boolean;
}

const TIME_OPTIONS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', 
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', 
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '04:00 PM', 
  '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', 
  '10:30 PM', '11:00 PM', '11:30 PM', '12:00 AM', '01:00 AM', '02:00 AM'
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'Monday', isOpen: true, openTime: '11:00 AM', closeTime: '11:00 PM', is24Hours: false },
  { day: 'Tuesday', isOpen: true, openTime: '11:00 AM', closeTime: '11:00 PM', is24Hours: false },
  { day: 'Wednesday', isOpen: true, openTime: '11:00 AM', closeTime: '11:00 PM', is24Hours: false },
  { day: 'Thursday', isOpen: true, openTime: '11:00 AM', closeTime: '11:00 PM', is24Hours: false },
  { day: 'Friday', isOpen: true, openTime: '11:00 AM', closeTime: '11:30 PM', is24Hours: false },
  { day: 'Saturday', isOpen: true, openTime: '11:00 AM', closeTime: '11:30 PM', is24Hours: false },
  { day: 'Sunday', isOpen: true, openTime: '11:00 AM', closeTime: '11:30 PM', is24Hours: false },
];

const HOURS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const NOTIFS = [
  { label: 'New Google Reviews', sub: 'Get notified when you receive a new review', checked: true },
  { label: 'Low Ratings (1-3 stars)', sub: 'Instant alerts for negative reviews', checked: true },
  { label: 'Menu Scan Notifications', sub: 'Get notified when customers view your menu', checked: true },
  { label: 'New Customer Insights', sub: 'Weekly summary of customer activity', checked: false },
  { label: 'System Updates', sub: 'Important updates and new features', checked: true },
];

export default function SettingsPage() {
  useEffect(() => {
    const handleActivated = () => {
      setActiveBiz(prev => prev ? { ...prev, planStatus: 'active' } : null);
      setShowGatewayModal(false);
    };
    window.addEventListener('pixora:dashboard_activated', handleActivated);
    return () => window.removeEventListener('pixora:dashboard_activated', handleActivated);
  }, []);
  const [activeTab, setActiveTab] = useState(0);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [notifs, setNotifs] = useState(NOTIFS.map(n => n.checked));
  const [businessName, setBusinessName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Real Google Integration Status State
  const [googleInfo, setGoogleInfo] = useState<GoogleConnectionInfo>({
    status: 'not_connected',
    source: 'none',
  });
  const [showGoogleLinkModal, setShowGoogleLinkModal] = useState(false);
  const [googleInputUrl, setGoogleInputUrl] = useState('');
  const [googleSearchQuery, setGoogleSearchQuery] = useState('');
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [googleCandidates, setGoogleCandidates] = useState<GoogleBusinessDetails[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<GoogleBusinessDetails | null>(null);
  const [googleLiveActive, setGoogleLiveActive] = useState<boolean | null>(null);
  const [googleConsoleNotice, setGoogleConsoleNotice] = useState<string | null>(null);
  const [googleActiveMode, setGoogleActiveMode] = useState<'search' | 'accounts' | 'direct_link'>('search');
  const [googleAccountsList, setGoogleAccountsList] = useState<GoogleBusinessAccount[]>([]);
  const [googleIntegrationStatus, setGoogleIntegrationStatus] = useState<'connected' | 'access_pending' | 'requires_auth' | null>(null);
  const [googleApiWarning, setGoogleApiWarning] = useState<string | null>(null);
  const [googleOAuthStatusBanner, setGoogleOAuthStatusBanner] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSavingGoogleLink, setIsSavingGoogleLink] = useState(false);
  const [googleLinkError, setGoogleLinkError] = useState<string | null>(null);
  const [googleLinkSuccess, setGoogleLinkSuccess] = useState<string | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // Tab 3: Operating Schedule State
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [scheduleNote, setScheduleNote] = useState('Kitchen closes 30 minutes before closing time. Takeaway available.');
  const [showHoursInFunnel, setShowHoursInFunnel] = useState(true);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSavedSuccess, setHoursSavedSuccess] = useState(false);

  // Tab 2: Notification Preferences & Live Activity
  const [notifPreferences, setNotifPreferences] = useState({
    negativeAlerts: true,
    newGoogleReviews: true,
    menuScans: true,
    weeklyDigest: true,
    systemUpdates: true,
    soundAlerts: true,
    smsEscalation: false,
  });
  const [notifWhatsAppNumber, setNotifWhatsAppNumber] = useState('');
  const [notifEmailAddress, setNotifEmailAddress] = useState('');
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);
  const [notifsSavedSuccess, setNotifsSavedSuccess] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);
  const [testNotifSuccess, setTestNotifSuccess] = useState<string | null>(null);

  // Tab 5: Account Profile & Security State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accountFullName, setAccountFullName] = useState('');
  const [accountPhoneInput, setAccountPhoneInput] = useState('');
  const [copiedAccountId, setCopiedAccountId] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [accountSavedSuccess, setAccountSavedSuccess] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Tab 6: Billing & License Activation State
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isActivatingLicenseKey, setIsActivatingLicenseKey] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gatewayPlan, setGatewayPlan] = useState({
    planId: 'plan_2year_software',
    planName: 'Standard 2-Year Plan',
    amount: 2599,
  });
  const [licenseKeySuccess, setLicenseKeySuccess] = useState<string | null>(null);
  const [licenseKeyError, setLicenseKeyError] = useState<string | null>(null);

  // =========================================================================
  // Funnel Appearance & Visual Theming Studio State
  // =========================================================================
  const allCategories = getAllCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState('restaurant');
  const [customCoverImage, setCustomCoverImage] = useState<string | undefined>(undefined);
  const [selectedImageOption, setSelectedImageOption] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#0B3D2E');
  const [secondaryColor, setSecondaryColor] = useState('#D4AF37');
  const [fontStyle, setFontStyle] = useState<FontStyle>('elegant');
  const [overlayType, setOverlayType] = useState<OverlayType>('dark');
  const [overlayOpacity, setOverlayOpacity] = useState(0.65);
  const [headline, setHeadline] = useState('How was your experience with us?');
  const [subheadline, setSubheadline] = useState('Your feedback means a lot! Share your experience and help others discover us on Google.');
  const [ctaText, setCtaText] = useState('Share Your Experience');
  const [postCompletionCTA, setPostCompletionCTA] = useState('View Our Menu');
  const [menuEnabled, setMenuEnabled] = useState(true);
  const [servicesEnabled, setServicesEnabled] = useState(false);
  const [productsEnabled, setProductsEnabled] = useState(false);
  const [appearanceSavedSuccess, setAppearanceSavedSuccess] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const [previewRating, setPreviewRating] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    const slug = businessService.getActiveBusinessSlug();
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setAccountFullName(user.name || '');
      setAccountPhoneInput(user.phone || '');
    }

    businessService.getBusinessBySlug(slug).then(biz => {
      if (biz) {
        setActiveBiz(biz);
        setBusinessName(biz.name || '');
        setTagline(biz.theme?.tagline || biz.category || '');
        if (biz.description) setDescription(biz.description);

        // Fetch Real Google Connection Status (Zero dummy data)
        googleBusinessProfileService.getConnectionStatus(biz).then(setGoogleInfo);
        
        // Dynamic Phone: prioritized from business or user account, otherwise blank
        const resolvedPhone = biz.phone || user?.phone || '';
        setPhone(resolvedPhone);
        setNotifWhatsAppNumber(resolvedPhone);

        // Dynamic Email: customer sign-in email if available on Google profile / user session, otherwise blank
        const resolvedEmail = user?.email || biz.email || '';
        setEmail(resolvedEmail);
        setNotifEmailAddress(resolvedEmail);

        if (biz.website) setWebsite(biz.website);
        if (biz.address) {
          setAddress(biz.address);
        } else if (biz.city) {
          setAddress(`${biz.city}, India`);
        } else {
          setAddress('');
        }

        // Load Business Hours if stored in theme
        const storedHours = (biz.theme as any)?.businessHours;
        if (Array.isArray(storedHours) && storedHours.length === 7) {
          setSchedule(storedHours);
        }
        if ((biz.theme as any)?.hoursNote) {
          setScheduleNote((biz.theme as any).hoursNote);
        }
        if ((biz.theme as any)?.showHoursInFunnel !== undefined) {
          setShowHoursInFunnel((biz.theme as any).showHoursInFunnel);
        }

        // Load Notification Preferences
        if (typeof window !== 'undefined') {
          const storedPrefs = localStorage.getItem('pixora_notif_prefs_' + (biz.slug || 'default'));
          if (storedPrefs) {
            try {
              setNotifPreferences(JSON.parse(storedPrefs));
            } catch (e) {}
          }
        }

        // Load recent notifications
        notificationService.getNotifications(biz.businessId || biz.id).then(setRecentNotifications);

        // Load visual appearance defaults
        const catConfig = normalizeBusinessCategory(biz.category);
        setSelectedCategoryId(catConfig.id);
        setCustomCoverImage(biz.customCoverImage);
        setPrimaryColor(biz.theme?.primaryColor || catConfig.defaultPrimaryColor);
        setSecondaryColor(biz.theme?.secondaryColor || catConfig.defaultSecondaryColor);
        setFontStyle((biz.theme?.fontStyle as any) || catConfig.defaultFontStyle);
        setOverlayType((biz.theme?.overlayType as any) || catConfig.overlay.type);
        setOverlayOpacity(biz.theme?.overlayOpacity ?? catConfig.overlay.opacity);
        setHeadline(biz.theme?.headline || catConfig.headline);
        setSubheadline(biz.theme?.subheadline || catConfig.subheadline);
        setCtaText(biz.theme?.ctaText || catConfig.suggestedCTA);
        setPostCompletionCTA(biz.theme?.postCompletionCTA || catConfig.postCompletionCTA);
        setMenuEnabled(biz.theme?.menuEnabled ?? catConfig.menuEnabled);
        setServicesEnabled(biz.theme?.servicesEnabled ?? catConfig.servicesEnabled);
        setProductsEnabled(biz.theme?.productsEnabled ?? catConfig.productsEnabled);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Failed to load settings:', err);
      setLoadError('Settings are temporarily unavailable.');
      setIsLoading(false);
    });

    // Check if redirected back from Google OAuth 2.0 callback
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const googleStatus = params.get('google_status');
      const googleMsg = params.get('google_message');
      const googleEmail = params.get('google_email');

      if (googleStatus === 'connected') {
        setGoogleOAuthStatusBanner({
          type: 'success',
          message: `Google Business Profile successfully connected${googleEmail ? ` (${googleEmail})` : ''}!`,
        });
        handleLoadGoogleAccounts();
      } else if (googleStatus === 'access_pending') {
        setGoogleOAuthStatusBanner({
          type: 'warning',
          message: googleMsg || 'Google OAuth authorized! Google Business Profile API access approval is currently pending. Location routing is active via direct Place link.',
        });
        handleLoadGoogleAccounts();
      } else if (googleStatus === 'credentials_missing') {
        setGoogleOAuthStatusBanner({
          type: 'warning',
          message: googleMsg || 'Google OAuth 2.0 Client ID is not configured in server environment.',
        });
      } else if (googleStatus === 'cancelled') {
        setGoogleOAuthStatusBanner({
          type: 'info',
          message: 'Google authorization was cancelled by the user.',
        });
      } else if (googleStatus) {
        setGoogleOAuthStatusBanner({
          type: 'warning',
          message: googleMsg || 'Google authorization could not be completed.',
        });
      }
    }
  }, [loadAttempt]);

  const activeCategoryConfig = BUSINESS_CATEGORIES[selectedCategoryId] || normalizeBusinessCategory(selectedCategoryId);
  const isFood = isFoodAndDiningBusiness(selectedCategoryId || activeBiz?.category);
  const activeBgImage = customCoverImage || selectedImageOption || activeCategoryConfig.backgroundImage || DEFAULT_FUNNEL_BACKGROUND;

  const isRestaurant = activeBiz?.category?.toLowerCase().includes('restaurant') || activeBiz?.category?.toLowerCase().includes('cafe') || false;
  const profileLabel = isRestaurant ? 'Restaurant Profile' : 'Business Profile';
  const TABS = [profileLabel, 'Integrations', 'Notifications', 'Business Hours', 'Appearance', 'Account', 'Billing'];
  const isLocallyActiveSettings = typeof window !== 'undefined' && activeBiz && (
    localStorage.getItem(`pixora_plan_active_${activeBiz.id}`) === 'true' ||
    localStorage.getItem(`pixora_plan_active_${activeBiz.businessId}`) === 'true' ||
    localStorage.getItem(`pixora_plan_active_${activeBiz.slug}`) === 'true'
  );
  const isAccountUpgradedInSettings = activeBiz?.planStatus === 'active' || Boolean(isLocallyActiveSettings);


  // Handle changing business category
  const handleCategoryChange = (catId: string) => {
    const cat = BUSINESS_CATEGORIES[catId];
    if (!cat) return;
    setSelectedCategoryId(cat.id);

    // Preload category background immediately to avoid visual lag
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = cat.backgroundImage;
    }

    // Auto-update theme attributes to category recommendations
    setSelectedImageOption(null);
    setPrimaryColor(cat.defaultPrimaryColor);
    setSecondaryColor(cat.defaultSecondaryColor);
    setFontStyle(cat.defaultFontStyle);
    setOverlayType(cat.overlay.type);
    setOverlayOpacity(cat.overlay.opacity);
    setHeadline(cat.headline);
    setSubheadline(cat.subheadline);
    setCtaText(cat.suggestedCTA);
    setPostCompletionCTA(cat.postCompletionCTA);
    setMenuEnabled(cat.menuEnabled);
    setServicesEnabled(cat.servicesEnabled);
    setProductsEnabled(cat.productsEnabled);
  };

  // Custom Cover Image Upload (Instant FileReader)
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomCoverImage(dataUrl);
        setSelectedImageOption(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset to Recommended category visual defaults
  const handleResetToRecommended = async () => {
    if (!activeBiz) return;
    setIsSavingAppearance(true);
    const resetBiz = await businessService.resetBusinessAppearance(activeBiz.slug);
    if (resetBiz) {
      setActiveBiz(resetBiz);
      const cat = normalizeBusinessCategory(resetBiz.category);
      setSelectedCategoryId(cat.id);
      setCustomCoverImage(undefined);
      setSelectedImageOption(null);
      setPrimaryColor(cat.defaultPrimaryColor);
      setSecondaryColor(cat.defaultSecondaryColor);
      setFontStyle(cat.defaultFontStyle);
      setOverlayType(cat.overlay.type);
      setOverlayOpacity(cat.overlay.opacity);
      setHeadline(cat.headline);
      setSubheadline(cat.subheadline);
      setCtaText(cat.suggestedCTA);
      setPostCompletionCTA(cat.postCompletionCTA);
      setMenuEnabled(cat.menuEnabled);
      setServicesEnabled(cat.servicesEnabled);
      setProductsEnabled(cat.productsEnabled);
      setAppearanceSavedSuccess(true);
      setTimeout(() => setAppearanceSavedSuccess(false), 3000);
    }
    setIsSavingAppearance(false);
  };

  // Save Appearance Changes to Business Service & Storage
  const handleSaveAppearance = async () => {
    if (!activeBiz) return;
    setIsSavingAppearance(true);
    const currentCat = BUSINESS_CATEGORIES[selectedCategoryId] || normalizeBusinessCategory(selectedCategoryId);
    const activeBg = customCoverImage || selectedImageOption || currentCat.backgroundImage;

    const updated = await businessService.updateBusinessAppearance(activeBiz.slug, {
      category: currentCat.name,
      customCoverImage,
      coverImage: activeBg,
      primaryColor,
      secondaryColor,
      fontStyle,
      overlayType,
      overlayOpacity,
      headline,
      subheadline,
      ctaText,
      postCompletionCTA,
      menuEnabled,
      servicesEnabled,
      productsEnabled,
    });

    if (updated) {
      setActiveBiz(updated);
      setAppearanceSavedSuccess(true);
      setTimeout(() => setAppearanceSavedSuccess(false), 3500);
    }
    setIsSavingAppearance(false);
  };

  const handleSaveChanges = async () => {
    if (activeBiz) {
      const updated = await businessService.createOrUpdateBusiness({
        ...activeBiz,
        name: businessName,
        phone,
        email,
        website,
        address,
        description,
        theme: {
          ...activeBiz.theme,
          tagline,
        }
      });
      if (updated) {
        setActiveBiz(updated);
      }
    }

    const currentUser = authService.getCurrentUser();
    if (currentUser && phone) {
      await authService.updateUserPhone(currentUser.id, phone);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleOpenGoogleLinkModal = () => {
    const existing = activeBiz?.googleReviewUrl || (activeBiz as any)?.googleMapsUrl || '';
    setGoogleInputUrl(existing);
    const initialQuery = businessName || activeBiz?.name || existing || '';
    setGoogleSearchQuery(initialQuery);
    setGoogleLinkError(null);
    setGoogleLinkSuccess(null);
    setGoogleCandidates([]);
    setSelectedCandidate(null);
    setGoogleConsoleNotice(null);
    setGoogleActiveMode('search');
    setShowGoogleLinkModal(true);

    handleLoadGoogleAccounts();

    // Auto-search if business name is available and not yet searched
    if (initialQuery.trim() && initialQuery.length > 2) {
      handleFetchGoogleLocations(initialQuery.trim());
    }
  };

  const handleConnectGoogleOAuth = () => {
    const bizId = activeBiz?.businessId || activeBiz?.id || '';
    if (!bizId) {
      setGoogleLinkError('Please select a business before authorizing with Google.');
      return;
    }
    googleBusinessProfileService.initiateOAuth(bizId, '/dashboard/settings');
  };

  const handleLoadGoogleAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const bizId = activeBiz?.businessId || activeBiz?.id || '';
      const result = await googleBusinessProfileService.getAccountsAndStatus({ businessId: bizId });
      setGoogleAccountsList(result.accounts);
      setGoogleIntegrationStatus(result.integrationStatus);
      setGoogleApiWarning(result.apiWarning);
    } catch (err: any) {
      console.warn('Could not load Google Business accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleFetchGoogleLocations = async (queryToSearch?: string) => {
    const q = (queryToSearch || googleSearchQuery || googleInputUrl || businessName || '').trim();
    if (!q) {
      setGoogleLinkError('Please enter a business name, city, or Google Maps link to search.');
      return;
    }

    setIsSearchingGoogle(true);
    setGoogleLinkError(null);
    setGoogleConsoleNotice(null);

    try {
      const result = await googlePlacesService.searchBusiness(q);
      const candidates = result.candidates && result.candidates.length > 0
        ? result.candidates
        : (result.place ? [result.place] : []);

      setGoogleCandidates(candidates);
      if (candidates.length > 0) {
        setSelectedCandidate(candidates[0]);
      }
      setGoogleLiveActive(!!result.isGoogleLive);

      if (result.googleApiError) {
        setGoogleConsoleNotice(
          result.googleApiError.message ||
          'Places API (New) requires activation in your Google Cloud Console.'
        );
      } else {
        setGoogleConsoleNotice(null);
      }
    } catch (err: any) {
      setGoogleLinkError(err?.message || 'Failed to search Google Business Profile locations.');
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  const handleApplyGoogleProfile = async (candidate?: GoogleBusinessDetails) => {
    const target = candidate || selectedCandidate;
    if (!target) {
      setGoogleLinkError('Please select a business location first.');
      return;
    }

    setIsSavingGoogleLink(true);
    setGoogleLinkError(null);

    try {
      const finalReviewUrl = target.reviewUrl || 
        (target.placeId ? `https://search.google.com/local/writereview?placeid=${target.placeId}` : '') ||
        target.googleMapsUri ||
        googleInputUrl.trim();

      // Update active business form fields so user immediately sees their fetched business details
      if (target.name) setBusinessName(target.name);
      if (target.address) setAddress(target.address);
      if (target.phone && (!phone || phone === '')) setPhone(target.phone);
      if (target.website && (!website || website === '')) setWebsite(target.website);
      if (target.photoUrl) setCustomCoverImage(target.photoUrl);

      // Persist to active business and Supabase
      const bizId = activeBiz?.businessId || activeBiz?.id || '';
      if (activeBiz) {
        const updatedBiz: Business = {
          ...activeBiz,
          name: target.name || activeBiz.name,
          address: target.address || activeBiz.address,
          city: target.city || activeBiz.city,
          phone: target.phone || activeBiz.phone,
          website: target.website || activeBiz.website,
          rating: target.rating || activeBiz.rating || 5.0,
          reviewsCount: target.reviewCount || activeBiz.reviewsCount || 0,
          googlePlaceId: target.locationId || target.placeId,
          googleReviewUrl: finalReviewUrl,
          coverImage: target.photoUrl || activeBiz.coverImage,
        };
        setActiveBiz(updatedBiz);
        await businessService.createOrUpdateBusiness(updatedBiz);
      }

      // Link in Google Business Profile service
      await googleBusinessProfileService.linkGoogleProfile(bizId, {
        reviewUrl: finalReviewUrl,
        placeId: target.placeId,
        mapsUrl: target.googleMapsUri || finalReviewUrl,
        accountId: target.accountId,
        locationId: target.locationId || target.placeId,
      });

      if (activeBiz) {
        const status = await googleBusinessProfileService.getConnectionStatus({
          ...activeBiz,
          googlePlaceId: target.locationId || target.placeId,
          googleReviewUrl: finalReviewUrl,
        });
        setGoogleInfo(status);
      }

      setGoogleLinkSuccess(`Location "${target.name}" connected! Business details imported.`);
      setTimeout(() => {
        setShowGoogleLinkModal(false);
        setGoogleLinkSuccess(null);
      }, 1500);
    } catch (err: any) {
      setGoogleLinkError(err?.message || 'Failed to apply Google Business Profile.');
    } finally {
      setIsSavingGoogleLink(false);
    }
  };

  const handleSaveGoogleLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = googleInputUrl.trim();
    if (!url) {
      setGoogleLinkError('Please enter a Google Maps review URL or place link.');
      return;
    }

    setIsSavingGoogleLink(true);
    setGoogleLinkError(null);
    try {
      const bizId = activeBiz?.businessId || activeBiz?.id || '';
      const res = await googleBusinessProfileService.linkGoogleProfile(bizId, { reviewUrl: url });
      if (!res.success) {
        setGoogleLinkError(res.message);
        return;
      }

      if (activeBiz) {
        const derivedPlaceId = url.includes('placeid=') 
          ? (url.match(/placeid=([a-zA-Z0-9_-]+)/)?.[1] || activeBiz.googlePlaceId) 
          : activeBiz.googlePlaceId;

        const updatedBiz: Business = {
          ...activeBiz,
          googleReviewUrl: url,
          googlePlaceId: derivedPlaceId,
        };
        setActiveBiz(updatedBiz);
        await businessService.createOrUpdateBusiness(updatedBiz);
        const status = await googleBusinessProfileService.getConnectionStatus(updatedBiz);
        setGoogleInfo(status);
      }

      setGoogleLinkSuccess('Google Business link verified and connected successfully!');
      setTimeout(() => {
        setShowGoogleLinkModal(false);
        setGoogleLinkSuccess(null);
      }, 1500);
    } catch (err: any) {
      setGoogleLinkError(err?.message || 'Failed to link Google profile.');
    } finally {
      setIsSavingGoogleLink(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!activeBiz) return;
    const confirmed = typeof window !== 'undefined' && window.confirm('Are you sure you want to disconnect this Google Business Profile? Review routing will be paused until reconnected.');
    if (!confirmed) return;

    const bizId = activeBiz.businessId || activeBiz.id || '';
    await googleBusinessProfileService.disconnect(bizId);

    const updatedBiz: Business = {
      ...activeBiz,
      googlePlaceId: undefined,
      googleReviewUrl: undefined,
    };
    setActiveBiz(updatedBiz);
    await businessService.createOrUpdateBusiness(updatedBiz);
    const status = await googleBusinessProfileService.getConnectionStatus(updatedBiz);
    setGoogleInfo(status);
  };

  const handleSyncGoogleReviews = async () => {
    if (!activeBiz) return;
    setIsSyncingGoogle(true);
    setGoogleLinkError(null);
    setGoogleLinkSuccess(null);
    try {
      const bizId = activeBiz.businessId || activeBiz.id || '';
      const result = await googleBusinessProfileService.syncReviews(bizId);
      if (result.success) {
        setGoogleLinkSuccess(result.message || `${result.syncedCount} Google reviews synchronized successfully.`);
        setTimeout(() => setGoogleLinkSuccess(null), 4000);
      } else if (result.status === 'access_pending') {
        setGoogleIntegrationStatus('access_pending');
        setGoogleApiWarning(result.message);
      } else {
        setGoogleLinkError(result.message);
      }
      const status = await googleBusinessProfileService.getConnectionStatus(activeBiz);
      setGoogleInfo(status);
    } catch (err: any) {
      setGoogleLinkError(err?.message || 'Failed to sync Google reviews.');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // =========================================================================
  // Tab 3: Operating Schedule Handlers
  // =========================================================================
  const handleToggleDay = (idx: number) => {
    setSchedule(prev => prev.map((item, i) => i === idx ? { ...item, isOpen: !item.isOpen } : item));
  };

  const handleChangeDayTime = (idx: number, field: 'openTime' | 'closeTime', val: string) => {
    setSchedule(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleToggle24Hours = (idx: number) => {
    setSchedule(prev => prev.map((item, i) => i === idx ? { ...item, is24Hours: !item.is24Hours } : item));
  };

  const handleCopyMondayToWeekdays = () => {
    const monday = schedule[0];
    setSchedule(prev => prev.map((item, i) => (i >= 1 && i <= 4) ? { ...item, isOpen: monday.isOpen, openTime: monday.openTime, closeTime: monday.closeTime, is24Hours: monday.is24Hours } : item));
  };

  const handleSetAllStandardHours = () => {
    setSchedule(prev => prev.map(item => ({ ...item, isOpen: true, openTime: '10:00 AM', closeTime: '10:00 PM', is24Hours: false })));
  };

  const handleSetAll24Hours = () => {
    setSchedule(prev => prev.map(item => ({ ...item, isOpen: true, is24Hours: true })));
  };

  const handleSaveBusinessHours = async () => {
    if (!activeBiz) return;
    setIsSavingHours(true);
    try {
      const updatedBiz: Business = {
        ...activeBiz,
        theme: {
          ...activeBiz.theme,
          businessHours: schedule,
          hoursNote: scheduleNote,
          showHoursInFunnel,
        } as any
      };
      setActiveBiz(updatedBiz);
      await businessService.createOrUpdateBusiness(updatedBiz);
      setHoursSavedSuccess(true);
      setTimeout(() => setHoursSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save operating hours:', err);
    } finally {
      setIsSavingHours(false);
    }
  };

  // =========================================================================
  // Tab 2: Notification Preferences & Test Alert Handlers
  // =========================================================================
  const handleSaveNotificationPreferences = async () => {
    setIsSavingNotifs(true);
    try {
      if (typeof window !== 'undefined' && activeBiz) {
        localStorage.setItem('pixora_notif_prefs_' + activeBiz.slug, JSON.stringify(notifPreferences));
      }
      setNotifsSavedSuccess(true);
      setTimeout(() => setNotifsSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save notif preferences:', err);
    } finally {
      setIsSavingNotifs(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!activeBiz) return;
    setIsSendingTestNotif(true);
    try {
      const testItem = await notificationService.sendNotification({
        businessId: activeBiz.businessId || activeBiz.id,
        title: '🔔 Test Notification · Pixora Alert System',
        message: `Verified test alert delivered to ${notifWhatsAppNumber || phone || 'your registered number'}. All review notification channels are operational.`,
        type: 'system',
        link: '/dashboard/settings',
      });
      setRecentNotifications(prev => [testItem, ...prev]);
      setTestNotifSuccess('Test alert dispatched! Notification logged in your activity stream below.');
      setTimeout(() => setTestNotifSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to send test alert:', err);
    } finally {
      setIsSendingTestNotif(false);
    }
  };

  // =========================================================================
  // Tab 5: Account Profile & Security Handlers
  // =========================================================================
  const handleSaveAccountProfile = async () => {
    if (!currentUser) return;
    setIsSavingAccount(true);
    try {
      await authService.updateUserProfile(currentUser.id, {
        name: accountFullName,
        phone: accountPhoneInput,
      });
      if (accountPhoneInput) {
        await authService.updateUserPhone(currentUser.id, accountPhoneInput);
      }
      const updated = authService.getCurrentUser();
      if (updated) {
        setCurrentUser(updated);
        setPhone(updated.phone || '');
      }
      setAccountSavedSuccess(true);
      setTimeout(() => setAccountSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update account profile:', err);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setPasswordResetSent(true);
    setTimeout(() => setPasswordResetSent(false), 5000);
  };

  const handleSignOutAccount = async () => {
    const confirmOut = typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out of your Pixora account?');
    if (!confirmOut) return;
    await authService.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleCopyAccountId = () => {
    if (currentUser?.id && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentUser.id);
      setCopiedAccountId(true);
      setTimeout(() => setCopiedAccountId(false), 2000);
    }
  };

  // =========================================================================
  // Tab 6: Billing & License Key Handlers
  // =========================================================================
  const handleActivateLicenseKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const key = licenseKeyInput.trim().toUpperCase();
    if (!key) {
      setLicenseKeyError('Please enter an activation license key.');
      return;
    }
    setIsActivatingLicenseKey(true);
    setLicenseKeyError(null);
    setLicenseKeySuccess(null);

    try {
      const bizId = activeBiz?.businessId || activeBiz?.id || activeBiz?.slug || await businessService.getActiveBusinessId();
      const res = await businessService.activateDashboardWithLicenseKey(bizId, key);
      if (!res.success) {
        setLicenseKeyError(res.message);
        return;
      }
      setLicenseKeySuccess(res.message);
      if (activeBiz) {
        const updatedBiz: Business = {
          ...activeBiz,
          planStatus: 'active',
          trialExpiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        };
        setActiveBiz(updatedBiz);
      }
      setLicenseKeyInput('');
    } catch (err: any) {
      setLicenseKeyError(err?.message || 'Activation failed. Please contact billing support.');
    } finally {
      setIsActivatingLicenseKey(false);
    }
  };

  const handleDownloadInvoice = (item: string) => {
    const content = `PIXORA TECHNOLOGIES PRIVATE LIMITED\nTAX INVOICE & LICENSE RECEIPT\n----------------------------------------\nItem: ${item}\nBusiness: ${activeBiz?.name || 'Client'}\nDate: ${new Date().toLocaleDateString()}\nStatus: PAID / ACTIVE\nLicense Model: 2-Year Full Commercial\nSupport Desk: support@pixora.in | +91 92573 78047\n----------------------------------------\nThank you for choosing Pixora!`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pixora_Invoice_${(activeBiz?.slug || 'license')}_${Date.now().toString().slice(-4)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <PortalLoadingState label="Loading workspace settings" />;
  }

  if (loadError) {
    return <PortalErrorState description={loadError} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }

  return (
    <div className="pb-10 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Settings &amp; Personalization
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage your business profile, integrations, automated notifications, and customer review funnel visual theme.
          </p>
        </div>

        {activeTab === 4 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToRecommended}
              disabled={isSavingAppearance}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
              <span>Reset to Recommended</span>
            </button>
            <button
              onClick={handleSaveAppearance}
              disabled={isSavingAppearance}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-60"
            >
              {isSavingAppearance ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Appearance</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer',
              activeTab === i ? 'border-[#0B3D2E] text-[#0B3D2E]' : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            {tab}
            {tab === 'Appearance' && (
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Theme Studio
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 4: FUNNEL APPEARANCE & CATEGORY VISUAL THEME STUDIO */}
      {activeTab === 4 && (
        <div className="grid grid-cols-12 gap-8 items-start animate-fade-in">
          
          {/* LEFT 7 COLS: VISUAL CONFIGURATION STUDIO */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            
            {/* Success Toast */}
            {appearanceSavedSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Funnel appearance saved successfully! Your live customer funnel is updated.</span>
                </div>
                <a
                  href={`/f/${activeBiz?.slug || 'your-business'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-emerald-800 hover:text-emerald-950 ml-2"
                >
                  View live funnel →
                </a>
              </div>
            )}

            {/* 1. Category Engine Switcher */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mb-1">
                    <Store className="w-3 h-3 text-emerald-700" />
                    <span>Business Category Engine</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Business Category &amp; Visual Theme
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Changing your category automatically reconfigures your recommended visual theme, colors, and funnel copy.
                  </p>
                </div>
              </div>

              {/* Category Selector Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-700">
                  Select Business Category (25 Curated Themes Available)
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                >
                  {allCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Theme: {c.theme} ({c.defaultFontStyle} typography)
                    </option>
                  ))}
                </select>
              </div>

              {/* Detected Visual Theme Info Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-stone-50 to-emerald-50/40 border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Theme Identity</span>
                  <p className="text-xs font-bold text-slate-900 capitalize flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{activeCategoryConfig.theme} Theme Atmosphere</span>
                  </p>
                  <p className="text-[11px] text-stone-500">{activeCategoryConfig.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block font-medium">Suggested CTA</span>
                    <span className="text-xs font-bold text-emerald-900">{activeCategoryConfig.suggestedCTA}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Curated Background Image & Upload */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mb-1">
                    <ImageIcon className="w-3 h-3 text-emerald-700" />
                    <span>Background Image Selection</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Funnel Cover Atmosphere
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    High-resolution portrait 9:16 background photography. Zero text clutter behind UI cards.
                  </p>
                </div>
                
                {/* Upload Action */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCustomImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-800 bg-white shadow-2xs transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Upload Custom Image</span>
                  </button>
                </div>
              </div>

              {/* Recommended Default vs Curated Options Grid */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-stone-700 block">
                  Curated Category Variations for {activeCategoryConfig.name}:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Curated Option 1 (Default Recommended) */}
                  <div 
                    onClick={() => {
                      setCustomCoverImage(undefined);
                      setSelectedImageOption(activeCategoryConfig.backgroundImage);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 p-2 cursor-pointer transition-all ${
                      !customCoverImage && (selectedImageOption === activeCategoryConfig.backgroundImage || !selectedImageOption)
                        ? 'border-emerald-800 ring-2 ring-emerald-800/20 bg-emerald-50/30 shadow-md'
                        : 'border-stone-200 hover:border-stone-400 bg-white'
                    }`}
                  >
                    <div className="relative h-28 rounded-lg overflow-hidden bg-stone-900">
                      <img
                        src={activeCategoryConfig.backgroundImage}
                        alt="Recommended Default"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-900/90 text-[9px] font-bold text-white shadow-xs">
                        Recommended
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-medium text-amber-300">
                        ★ 9.8 / 10
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-900">Option 1 (Default)</p>
                      <p className="text-[10px] text-stone-500">Curated 9:16 portrait</p>
                    </div>
                  </div>

                  {/* Curated Option 2 */}
                  {activeCategoryConfig.imageOptions?.[1] && (
                    <div 
                      onClick={() => {
                        setCustomCoverImage(undefined);
                        setSelectedImageOption(activeCategoryConfig.imageOptions[1].url);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 p-2 cursor-pointer transition-all ${
                        !customCoverImage && selectedImageOption === activeCategoryConfig.imageOptions[1].url
                          ? 'border-emerald-800 ring-2 ring-emerald-800/20 bg-emerald-50/30 shadow-md'
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="relative h-28 rounded-lg overflow-hidden bg-stone-900">
                        <img
                          src={activeCategoryConfig.imageOptions[1].url}
                          alt={activeCategoryConfig.imageOptions[1].label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-medium text-amber-300">
                          ★ {activeCategoryConfig.imageOptions[1].qualityScore}/10
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          Option 2 ({activeCategoryConfig.imageOptions[1].label})
                        </p>
                        <p className="text-[10px] text-stone-500">Curated alternative</p>
                      </div>
                    </div>
                  )}

                  {/* Curated Option 3 */}
                  {activeCategoryConfig.imageOptions?.[2] && (
                    <div 
                      onClick={() => {
                        setCustomCoverImage(undefined);
                        setSelectedImageOption(activeCategoryConfig.imageOptions[2].url);
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 p-2 cursor-pointer transition-all ${
                        !customCoverImage && selectedImageOption === activeCategoryConfig.imageOptions[2].url
                          ? 'border-emerald-800 ring-2 ring-emerald-800/20 bg-emerald-50/30 shadow-md'
                          : 'border-stone-200 hover:border-stone-400 bg-white'
                      }`}
                    >
                      <div className="relative h-28 rounded-lg overflow-hidden bg-stone-900">
                        <img
                          src={activeCategoryConfig.imageOptions[2].url}
                          alt={activeCategoryConfig.imageOptions[2].label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-medium text-amber-300">
                          ★ {activeCategoryConfig.imageOptions[2].qualityScore}/10
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          Option 3 ({activeCategoryConfig.imageOptions[2].label})
                        </p>
                        <p className="text-[10px] text-stone-500">Curated alternative</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Uploaded Banner */}
                {customCoverImage && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-300 shrink-0">
                        <img src={customCoverImage} alt="Custom" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-950">Custom Upload Active</p>
                        <p className="text-[10px] text-amber-800">Your uploaded photo overrides the category default.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomCoverImage(undefined)}
                      className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
                    >
                      Clear &amp; Use Category Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Color Palette, Overlay & Typography Controls */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-6 space-y-5">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <Palette className="w-3 h-3 text-emerald-700" />
                <span>Colors &amp; Atmosphere Overlay</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Brand Palette &amp; Contrast Tuning
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Primary Color */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Primary Brand Color (Buttons &amp; Highlights)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono uppercase text-slate-900"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Secondary Accent Color (Badges &amp; Icons)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono uppercase text-slate-900"
                    />
                  </div>
                </div>

                {/* Overlay Treatment */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Atmospheric Overlay Style
                  </label>
                  <select
                    value={overlayType}
                    onChange={(e) => setOverlayType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="dark">Dark Ambient Vignette (Default)</option>
                    <option value="gradient">Subtle Gradient Shading</option>
                    <option value="blur">Atmospheric Soft Blur</option>
                    <option value="ambient">Ambient Theme Glow</option>
                    <option value="light">Crisp Light Treatment</option>
                  </select>
                </div>

                {/* Overlay Opacity Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                    <span>Overlay Darkness Strength</span>
                    <span className="font-mono text-emerald-800">{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-full accent-emerald-800 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 4. Funnel Copy & Calls to Action */}
            <div className="bg-white rounded-2xl shadow-xs border border-stone-200 p-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <Type className="w-3 h-3 text-emerald-700" />
                <span>Customer Copy &amp; CTAs</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Category Headlines &amp; Button Prompts
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Primary Funnel Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. How was your experience with us?"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Initial Action CTA
                    </label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Share Your Experience"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Post-Completion CTA
                    </label>
                    <input
                      type="text"
                      value={postCompletionCTA}
                      onChange={(e) => setPostCompletionCTA(e.target.value)}
                      placeholder="e.g. View Our Menu"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Capability Toggles */}
                <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={menuEnabled}
                      onChange={(e) => setMenuEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>{isFood ? 'Food Menu Enabled' : 'Product & Service Catalogue Enabled'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={servicesEnabled}
                      onChange={(e) => setServicesEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>Services Showcase Enabled</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={productsEnabled}
                      onChange={(e) => setProductsEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
                    />
                    <span>Product Catalog Enabled</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-stone-100 rounded-2xl flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">
                Changes apply immediately to your live customer funnel.
              </span>
              <button
                type="button"
                onClick={handleSaveAppearance}
                disabled={isSavingAppearance}
                className="px-6 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-2"
              >
                {isSavingAppearance ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Appearance Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT 5 COLS: REAL-TIME INTERACTIVE SMARTPHONE PREVIEW */}
          <div className="col-span-12 lg:col-span-5 sticky top-20">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  Live Funnel Preview
                </span>
                <span className="text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeCategoryConfig.name}
                </span>
              </div>

              {/* Smartphone Frame */}
              <div className="relative mx-auto w-full max-w-[340px] rounded-[42px] bg-slate-950 p-3 shadow-2xl border-4 border-slate-800">
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800" />
                </div>

                {/* Inner Screen */}
                <div className="w-full h-[640px] rounded-[34px] overflow-hidden text-white flex flex-col relative select-none bg-stone-900">
                  {/* Background Image */}
                  <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                    <img
                      src={activeBgImage}
                      alt="Category Atmosphere"
                      className="w-full h-full object-cover object-center transition-all duration-300"
                    />
                    {/* Dynamic Overlay Treatment */}
                    <div 
                      className={`absolute inset-0 ${
                        overlayType === 'gradient'
                          ? 'bg-gradient-to-b from-black/80 via-black/40 to-black/90'
                          : overlayType === 'blur'
                          ? 'bg-black/60 backdrop-blur-[2px]'
                          : overlayType === 'ambient'
                          ? 'bg-gradient-to-t from-black/90 via-emerald-950/40 to-black/70'
                          : 'bg-black/75'
                      }`}
                      style={{ opacity: overlayOpacity }}
                    />
                  </div>

                  {/* Top Bar with Language Pill */}
                  <div className="relative z-10 pt-6 px-4 flex justify-end">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/20 text-white text-[10px] font-medium backdrop-blur-md">
                      <span>🌐</span>
                      <span>English</span>
                    </div>
                  </div>

                  {/* Scrollable Funnel Body */}
                  <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-1 pb-4 flex flex-col items-center no-scrollbar">
                    
                    {/* Brand Header */}
                    <div className="flex flex-col items-center mb-4 text-center">
                      <div className="w-10 h-10 relative mb-1.5 rounded-xl overflow-hidden shadow-lg border border-white/25 bg-white/10 backdrop-blur-md flex items-center justify-center">
                        <span className="text-lg">{activeCategoryConfig.icon || '✨'}</span>
                      </div>

                      <h3 
                        className="text-2xl font-bold tracking-tight text-[#F7F2E7] leading-tight"
                        style={{ fontFamily: fontStyle === 'elegant' ? "'Playfair Display', Georgia, serif" : 'sans-serif' }}
                      >
                        {businessName}
                      </h3>

                      <p 
                        className="text-[9px] tracking-[0.22em] uppercase font-semibold mt-0.5"
                        style={{ color: secondaryColor }}
                      >
                        {activeCategoryConfig.name}
                      </p>

                      <p className="text-[8px] tracking-[0.16em] uppercase text-white/70 font-normal mt-0.5">
                        {tagline}
                      </p>
                    </div>

                    {/* Headline */}
                    <div className="text-center mb-4 text-white">
                      <h4 
                        className="text-xl font-bold text-[#FAF5EB] leading-tight"
                        style={{ fontFamily: fontStyle === 'elegant' ? "'Playfair Display', Georgia, serif" : 'sans-serif' }}
                      >
                        {headline}
                      </h4>
                      <p className="text-[10px] text-stone-200/90 leading-tight mt-1 max-w-[220px] mx-auto font-light">
                        {subheadline}
                      </p>
                    </div>

                    {/* Central Review Card */}
                    <div className="w-full bg-white/98 rounded-[24px] p-4 shadow-xl border border-white/40 mb-3 text-slate-900">
                      {/* Google G Logo */}
                      <div className="flex justify-center mb-3">
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xs border border-gray-100">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
                            <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
                          </svg>
                        </div>
                      </div>

                      {/* 5 Stars */}
                      <div className="flex justify-center gap-1.5 mb-3.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setPreviewRating(star)}
                            className="cursor-pointer transition-transform hover:scale-115"
                          >
                            <Star 
                              className={`w-6 h-6 ${star <= previewRating ? 'fill-[#F4B400] text-[#F4B400]' : 'text-[#E5A812] stroke-[#E5A812] fill-transparent'}`} 
                              strokeWidth={1.75}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Pill Continue Button */}
                      <button
                        type="button"
                        style={{ backgroundColor: primaryColor }}
                        className="w-full py-2.5 rounded-full text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>{ctaText}</span>
                        <span>→</span>
                      </button>

                      {/* Micro-Features */}
                      <div className="grid grid-cols-3 gap-1 mt-3.5 pt-3 border-t border-gray-100 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-1 border border-[#FED7AA]/50">
                            <Zap className="w-3 h-3 text-[#D97706]" />
                          </div>
                          <span className="text-[9px] font-semibold text-gray-800 leading-tight">Quick<br/>&amp; Easy</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-1 border border-[#FED7AA]/50">
                            <Bot className="w-3 h-3 text-[#D97706]" />
                          </div>
                          <span className="text-[9px] font-semibold text-gray-800 leading-tight">AI Helps<br/>You Write</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-1 border border-[#FED7AA]/50">
                            <Clock className="w-3 h-3 text-[#D97706]" />
                          </div>
                          <span className="text-[9px] font-semibold text-gray-800 leading-tight">Takes<br/>30 Seconds</span>
                        </div>
                      </div>
                    </div>

                    {/* Happy Customers Banner */}
                    <div className="w-full bg-[#EAF2EC]/95 backdrop-blur-md rounded-[20px] p-2.5 flex items-center justify-between shadow-md border border-[#D1E0D9]/80 mb-2">
                      <div className="flex -space-x-2 shrink-0">
                        <img src="https://i.pravatar.cc/100?u=priya" alt="Customer" className="w-7 h-7 rounded-full border border-white object-cover" />
                        <img src="https://i.pravatar.cc/100?u=rohit" alt="Customer" className="w-7 h-7 rounded-full border border-white object-cover" />
                        <img src="https://i.pravatar.cc/100?u=karan" alt="Customer" className="w-7 h-7 rounded-full border border-white object-cover" />
                      </div>
                      <div className="text-left ml-2 flex-grow truncate">
                        <p className="font-bold text-[10px] text-gray-900 leading-tight">Join our happy customers</p>
                        <p className="text-[9px] text-gray-600 truncate">Your review helps others choose with confidence.</p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-[#D7E8DE] flex items-center justify-center shrink-0 ml-1">
                        <TrendingUp className="w-3 h-3 text-[#0B3D2E]" />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="w-full mt-auto pt-2 text-center">
                      <p className="text-[9px] text-white/80">
                        Powered by Pixora Automations ❤️
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 0: PROFILE MANAGEMENT */}
      {activeTab === 0 && (
        <div className="grid grid-cols-12 gap-5 animate-fade-in">
          {/* Left: Main Form */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {/* Banner promoting Appearance Studio */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Personalization Engine</span>
                <h4 className="text-sm font-bold text-white mt-0.5">Customize Your Customer Review Funnel Visuals</h4>
                <p className="text-xs text-stone-300">Switch category themes, curate 9:16 portrait backgrounds, or upload custom photography.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab(4)}
                className="px-4 py-2 rounded-xl bg-white text-emerald-950 font-bold text-xs hover:bg-emerald-50 transition cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
              >
                Open Theme Studio →
              </button>
            </div>

            {/* Restaurant Info */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{isRestaurant ? 'Restaurant Information' : 'Business Information'}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Update your basic location details. This information will be visible to your customers.</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleOpenGoogleLinkModal}
                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold px-3.5 py-2.5 rounded-xl cursor-pointer transition shadow-2xs"
                    title="Fetch locations and details from Google Business Profile"
                  >
                    <GoogleIcon />
                    <span>Fetch from Google</span>
                  </button>
                  <button 
                    onClick={handleSaveChanges}
                    className="flex items-center gap-2 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl cursor-pointer shadow-xs hover:opacity-95 transition" 
                    style={{ background: '#0B3D2E' }}
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
              {savedSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  ✓ Changes saved successfully!
                </div>
              )}

              <div className="grid grid-cols-12 gap-5">
                {/* Logo Upload */}
                <div className="col-span-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Business Logo</p>
                  <div className="relative w-full aspect-square max-w-[160px] rounded-2xl overflow-hidden border-2 border-gray-200 cursor-pointer group" style={{ background: '#0B3D2E' }}>
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
                        <path d="M32 8C32 8 18 20 18 34C18 42 24 48 32 48C40 48 46 42 46 34C46 20 32 8 32 8Z" fill="#D4AF37" opacity="0.9"/>
                        <path d="M32 20C32 20 22 28 22 37C22 42.5 26.5 47 32 47C37.5 47 42 42.5 42 37C42 28 32 20 32 20Z" fill="#0B3D2E"/>
                      </svg>
                      <p className="text-white font-bold text-xs text-center mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>{businessName}</p>
                      <p className="text-[#D4AF37] text-[7px] tracking-widest text-center uppercase mt-0.5">{tagline}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow">
                      <Upload className="w-3 h-3 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">Recommended: 512 × 512 px<br/>PNG, JPG (Max 5MB)</p>
                </div>

                {/* Name + Tagline */}
                <div className="col-span-8 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                      {isRestaurant ? 'Restaurant Name' : 'Business Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#0B3D2E]"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Tagline</label>
                    <div className="relative">
                      <input
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#0B3D2E]"
                        value={tagline}
                        onChange={e => setTagline(e.target.value)}
                        maxLength={50}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{tagline.length}/50</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#0B3D2E] resize-none"
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        maxLength={200}
                      />
                      <span className="absolute right-3 bottom-2 text-[10px] text-gray-400">{description.length}/200</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">Phone Number <span className="text-red-500">*</span></label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#0B3D2E]" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email Address</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#0B3D2E]" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Website (Optional)</label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#0B3D2E]" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pl-9 text-sm outline-none focus:ring-1 focus:ring-[#0B3D2E]" value={address} onChange={e => setAddress(e.target.value)} />
                  <PinIcon />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1">Social Media Links</h3>
              <p className="text-xs text-gray-400 mb-4">Add your social media profiles to build trust and connect with customers.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <InstagramIcon />, label: 'Instagram', value: 'https://instagram.com/yourbusiness', color: 'border-pink-200' },
                  { icon: <FacebookIcon />, label: 'Facebook', value: 'https://facebook.com/yourbusiness', color: 'border-blue-200' },
                  { icon: <YoutubeIcon />, label: 'YouTube', value: 'https://youtube.com/@yourbusiness', color: 'border-red-200' },
                  { icon: <WhatsAppIcon />, label: 'WhatsApp', value: phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : 'https://wa.me/', color: 'border-green-200' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                    <div className="shrink-0">{s.icon}</div>
                    <input
                      className="flex-1 text-sm outline-none text-gray-700 bg-transparent min-w-0"
                      defaultValue={s.value}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Widgets */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            {/* Google Integration Status (Real Data - Zero Dummy Data) */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Google Business Integration</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Live connection to your Google Maps review system</p>
                </div>
                <GoogleIcon />
              </div>

              {googleInfo.status === 'connected' ? (
                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-900">
                        {googleInfo.source === 'oauth' ? 'Connected (Google API Sync)' : 'Connected via Google Places'}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 font-semibold text-emerald-800">
                      Active
                    </span>
                  </div>

                  {googleInfo.placeId && (
                    <div className="text-[11px] text-emerald-800 font-mono truncate bg-white/70 px-2 py-1 rounded border border-emerald-200/40">
                      ID: {googleInfo.placeId}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {googleInfo.reviewUrl && (
                      <a
                        href={googleInfo.reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 underline"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenGoogleLinkModal}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 ml-auto cursor-pointer"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-800">Not Connected</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 font-semibold text-amber-800">
                      Action Needed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Connect your Google Business Profile or Review URL so customer NFC taps and QR scans route directly to your 5-star Google review page.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenGoogleLinkModal}
                    className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <span>Connect Google Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900">Notification Settings</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  Full Channels →
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">Choose what notifications you want to receive.</p>
              <div className="space-y-3">
                {NOTIFS.map((n, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={cn('w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center cursor-pointer border-2 transition-colors', notifs[i] ? 'bg-[#0B3D2E] border-[#0B3D2E]' : 'border-gray-300 bg-white')}
                      onClick={() => setNotifs(prev => prev.map((v, j) => j === i ? !v : v))}
                    >
                      {notifs[i] && <svg viewBox="0 0 10 10" className="w-3 h-3"><polyline points="1 5 4 8 9 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{n.label}</p>
                      <p className="text-[10px] text-gray-400">{n.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Business Hours</h3>
                  <p className="text-[10px] text-gray-400">Set your operating hours.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setActiveTab(3)}
                  className="text-xs text-[#0B3D2E] font-semibold border border-[#0B3D2E]/30 px-3 py-1 rounded-lg hover:bg-green-50 flex items-center gap-1 cursor-pointer"
                >
                  <ClockIcon /> Edit Hours
                </button>
              </div>
              <div className="space-y-2">
                {schedule.map((day, i) => (
                  <div key={day.day} className="flex items-center gap-3">
                    <div 
                      onClick={() => handleToggleDay(i)}
                      className={cn(
                        "w-8 h-4 rounded-full relative cursor-pointer shrink-0 transition-colors",
                        day.isOpen ? "bg-[#0B3D2E]" : "bg-stone-300"
                      )}
                    >
                      <div className={cn(
                        "w-3 h-3 bg-white rounded-full absolute top-0.5 shadow transition-all",
                        day.isOpen ? "right-0.5" : "left-0.5"
                      )} />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-20 shrink-0">{day.day}</span>
                    <span className="text-xs text-gray-500 flex-1 truncate">
                      {day.isOpen ? (day.is24Hours ? 'Open 24 Hours' : `${day.openTime} – ${day.closeTime}`) : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: DEDICATED REAL INTEGRATIONS HUB */}
      {activeTab === 1 && (
        <div className="space-y-6 animate-fade-in max-w-4xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Integrations &amp; External Connections</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage live connections with Google Business Profile, WhatsApp notifications, and customer review routing.
            </p>
          </div>

          {/* Primary Integration: Google Business Profile */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <GoogleIcon />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Google Business Profile</h3>
                    {googleInfo.status === 'connected' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Routes 5-star customer ratings from your NFC stands and review funnel directly to Google Maps.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {googleInfo.status === 'connected' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSyncGoogleReviews}
                      disabled={isSyncingGoogle}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGoogle ? 'Syncing...' : 'Sync Reviews'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenGoogleLinkModal}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition cursor-pointer"
                    >
                      <span>Update Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <span>Disconnect</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenGoogleLinkModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                  >
                    <span>Connect Google Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Connection Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Google Place ID</span>
                <p className="text-xs font-mono font-medium text-slate-900 truncate">
                  {googleInfo.placeId || 'No Google Place ID linked'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Direct Review Routing URL</span>
                {googleInfo.reviewUrl ? (
                  <a
                    href={googleInfo.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-800 hover:underline truncate flex items-center gap-1"
                  >
                    <span className="truncate">{googleInfo.reviewUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <p className="text-xs text-stone-400">Not configured</p>
                )}
              </div>
            </div>

            {googleInfo.status === 'not_connected' && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Review routing is currently inactive.</p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    When customers give 5-star ratings in your funnel, they must be redirected to your live Google review form. Click &ldquo;Connect Google Profile&rdquo; above to link your Google Maps review link.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Accessible Google Business Profile Accounts & Locations (Account Management API) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      Accessible Google Business Accounts &amp; Locations
                    </h3>
                    <GoogleConnectionBadge
                      status={googleIntegrationStatus}
                      compact
                    />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Account Management API
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Accounts and business profile locations accessible via your Google account credentials. Select an account to activate for your review funnel.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleConnectGoogleOAuth}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Connect with Google (OAuth)</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadGoogleAccounts}
                  disabled={isLoadingAccounts}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-semibold transition cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                  <span>{isLoadingAccounts ? 'Fetching...' : 'Fetch Accounts List'}</span>
                </button>
              </div>
            </div>

            {googleOAuthStatusBanner && (
              <div className={cn(
                'p-4 rounded-xl border flex items-start justify-between gap-3 text-xs leading-relaxed',
                googleOAuthStatusBanner.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : googleOAuthStatusBanner.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              )}>
                <div className="flex items-start gap-2.5">
                  {googleOAuthStatusBanner.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {googleOAuthStatusBanner.type === 'success' ? 'Google Account Connected' : 'Google OAuth Status'}
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-90">{googleOAuthStatusBanner.message}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleOAuthStatusBanner(null)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {googleIntegrationStatus === 'access_pending' && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="font-bold text-amber-950">Google Business Profile API Access Pending Approval</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Your Google Account is securely connected. Google requires developer approval for Google Business Profile API access before live reviews can be synced. In the meantime, you can search and activate your business location below via Place ID for automatic 5-star review routing!
                </p>
              </div>
            )}

            {/* List of Accounts and Locations to Activate */}
            <div className="space-y-4">
              {googleAccountsList.length === 0 ? (
                <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-3">
                  <p className="text-xs text-stone-600 font-medium max-w-md mx-auto">
                    Authorize Pixora Funnel to access your Google Business Profile to discover accounts, load verified locations, and manage customer reviews.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConnectGoogleOAuth}
                      className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize Google Account (OAuth)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadGoogleAccounts}
                      disabled={isLoadingAccounts}
                      className="px-4 py-2 bg-white border border-stone-300 hover:bg-stone-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      {isLoadingAccounts ? 'Fetching...' : 'Fetch Accessible Accounts'}
                    </button>
                  </div>
                </div>
              ) : (
                googleAccountsList.map((acc, aIdx) => (
                  <div key={acc.accountId || aIdx} className="space-y-3 p-4 bg-stone-50/70 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{acc.accountName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-stone-200">
                          {acc.type || 'PERSONAL'} · {acc.role || 'OWNER'}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {acc.locations.length} Locations Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {acc.locations.map((loc, lIdx) => {
                        const isCurrentActive = Boolean(
                          googleInfo.placeId === loc.locationId ||
                          (activeBiz?.googlePlaceId && loc.locationId.includes(activeBiz.googlePlaceId))
                        );

                        return (
                          <div
                            key={loc.locationId || lIdx}
                            className={cn(
                              'p-3.5 rounded-xl border transition flex flex-col justify-between gap-3 text-left',
                              isCurrentActive
                                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-600/20'
                                : 'bg-white border-stone-200 hover:border-emerald-700/40'
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {loc.name}
                                </h4>
                                {isCurrentActive && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-700 text-white shrink-0">
                                    Active Funnel
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                <span>{loc.address}</span>
                              </p>
                              <div className="flex items-center gap-2 pt-1 text-[11px]">
                                <span className="font-bold text-amber-600 flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{loc.rating.toFixed(1)}</span>
                                </span>
                                <span className="text-stone-400">({loc.reviewsCount} reviews)</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleApplyGoogleProfile({
                                  placeId: loc.locationId,
                                  locationId: loc.locationId,
                                  accountId: loc.accountId,
                                  name: loc.name,
                                  category: loc.category,
                                  categorySlug: loc.categorySlug,
                                  address: loc.address,
                                  city: loc.city,
                                  phone: loc.phone,
                                  website: loc.website,
                                  rating: loc.rating,
                                  reviewCount: loc.reviewsCount,
                                  photoUrl: loc.photoUrl,
                                  menuEnabled: loc.menuEnabled,
                                  servicesEnabled: loc.servicesEnabled,
                                  productsEnabled: loc.productsEnabled,
                                  googleMapsUri: loc.mapsUrl,
                                  reviewUrl: loc.reviewUrl,
                                })
                              }
                              disabled={isSavingGoogleLink || isCurrentActive}
                              className={cn(
                                'w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs',
                                isCurrentActive
                                  ? 'bg-emerald-100 text-emerald-900 cursor-default opacity-80'
                                  : 'bg-emerald-950 hover:bg-emerald-900 text-white'
                              )}
                            >
                              {isCurrentActive ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Active Funnel Location</span>
                                </>
                              ) : (
                                <>
                                  <Store className="w-3.5 h-3.5" />
                                  <span>Activate This Location</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Secondary Integration: WhatsApp Notifications */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <WhatsAppIcon />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">WhatsApp Alert System</h3>
                    {phone ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        No Number Registered
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Sends private customer feedback and negative review alerts directly to your mobile phone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(0)}
                className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                Edit in Profile →
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-slate-700 flex items-center justify-between">
              <span>Alert destination: <strong>{phone || 'Not provided'}</strong></span>
              {phone && (
                <a
                  href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <span>Test WhatsApp</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEDICATED NOTIFICATIONS & ESCALATION HUB */}
      {activeTab === 2 && (
        <div className="space-y-6 animate-fade-in max-w-5xl">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mb-1">
                <Bell className="w-3 h-3 text-emerald-700" />
                <span>Real-Time Alert Dispatcher</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Notification Channels &amp; Review Alerts
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Configure instant alerts for customer ratings, negative review interception, QR standee scans, and weekly performance digests.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={isSendingTestNotif}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-700 bg-white transition cursor-pointer shadow-2xs"
              >
                {isSendingTestNotif ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <BellRing className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>Send Test Alert</span>
              </button>
              <button
                type="button"
                onClick={handleSaveNotificationPreferences}
                disabled={isSavingNotifs}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isSavingNotifs ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Toasts */}
          {notifsSavedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Notification preferences saved and synced across all delivery pipelines.</span>
            </div>
          )}
          {testNotifSuccess && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl text-blue-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{testNotifSuccess}</span>
            </div>
          )}

          {/* Alert Destinations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. WhatsApp Alert Destination */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <WhatsAppIcon />
                  </div>
                  {phone ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Pending Number
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900">WhatsApp Alert Line</h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Direct mobile notifications for private 1-3 star customer feedback.
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 space-y-2">
                <input
                  type="tel"
                  value={notifWhatsAppNumber}
                  onChange={(e) => setNotifWhatsAppNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-800 outline-none font-medium"
                />
                {notifWhatsAppNumber && (
                  <a
                    href={`https://wa.me/${notifWhatsAppNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>Test WhatsApp Connection</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* 2. Email Summary Destination */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Verified
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Email Digest &amp; Reports</h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Weekly performance recap, rating milestones, and monthly ROI summaries.
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100">
                <input
                  type="email"
                  value={notifEmailAddress}
                  onChange={(e) => setNotifEmailAddress(e.target.value)}
                  placeholder="e.g. business@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-800 outline-none font-medium"
                />
              </div>
            </div>

            {/* 3. Audio & Emergency Alerts */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                    Enabled
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Dashboard Audio Chime</h4>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  Plays a subtle chime when customer reviews and ratings arrive in the portal.
                </p>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Sound Alert</span>
                <button
                  type="button"
                  onClick={() => setNotifPreferences(prev => ({ ...prev, soundAlerts: !prev.soundAlerts }))}
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative cursor-pointer",
                    notifPreferences.soundAlerts ? "bg-emerald-800" : "bg-stone-300"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full bg-white absolute top-1 shadow-xs transition-transform",
                      notifPreferences.soundAlerts ? "right-1" : "left-1"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notification Triggers Configuration Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-stone-200 bg-stone-50/50">
              <h3 className="font-bold text-slate-900 text-base">Automatic Event Triggers</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Enable or disable automated notification alerts dispatched to your team.
              </p>
            </div>

            <div className="divide-y divide-stone-100">
              {[
                {
                  id: 'negativeAlerts',
                  title: 'Low-Rating Alerts (1-3 Stars)',
                  desc: 'Immediate WhatsApp & Email ping when an unhappy customer submits private feedback in the funnel, saving your Google Maps rating before public posting.',
                  tag: 'Critical Escalation',
                  tagColor: 'bg-rose-50 text-rose-800 border-rose-200',
                  checked: notifPreferences.negativeAlerts,
                },
                {
                  id: 'newGoogleReviews',
                  title: '5-Star Google Review Milestones',
                  desc: 'Instant notifications when customers successfully complete 5-star review submissions or tap NFC cards.',
                  tag: 'Growth Milestone',
                  tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  checked: notifPreferences.newGoogleReviews,
                },
                {
                  id: 'menuScans',
                  title: 'QR Standee & NFC Tap Signals',
                  desc: 'Get alerted in real-time whenever your counter review standee, table NFC card, or digital catalog is scanned.',
                  tag: 'Live Traffic',
                  tagColor: 'bg-blue-50 text-blue-800 border-blue-200',
                  checked: notifPreferences.menuScans,
                },
                {
                  id: 'weeklyDigest',
                  title: 'Weekly Funnel Analytics Digest',
                  desc: 'Monday morning performance recap comparing scan volume, 5-star rating conversion rate, and estimated Google ranking lift.',
                  tag: 'Monday 9:00 AM',
                  tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
                  checked: notifPreferences.weeklyDigest,
                },
                {
                  id: 'systemUpdates',
                  title: 'Platform Announcements & Algorithm Updates',
                  desc: 'Important notifications regarding Google Maps algorithm shifts, new Pixora features, and account security notices.',
                  tag: 'System',
                  tagColor: 'bg-stone-100 text-stone-700 border-stone-200',
                  checked: notifPreferences.systemUpdates,
                },
              ].map((trigger) => (
                <div key={trigger.id} className="p-5 flex items-start justify-between gap-4 hover:bg-stone-50/40 transition">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{trigger.title}</h4>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", trigger.tagColor)}>
                        {trigger.tag}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{trigger.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNotifPreferences(prev => ({ ...prev, [trigger.id]: !(prev as any)[trigger.id] }))}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1",
                      (notifPreferences as any)[trigger.id] ? "bg-emerald-800" : "bg-stone-300"
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-1 shadow-xs transition-transform",
                        (notifPreferences as any)[trigger.id] ? "right-1" : "left-1"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notification Activity Stream */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent Activity &amp; Dispatched Alerts</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Audit log of recently dispatched system notices and customer activity alerts.
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                {recentNotifications.length} logged
              </span>
            </div>

            {recentNotifications.length === 0 ? (
              <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-500">
                No alerts recorded yet. Click &ldquo;Send Test Alert&rdquo; above to verify your delivery pipeline.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentNotifications.slice(0, 6).map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                        <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BUSINESS OPERATING HOURS SCHEDULE */}
      {activeTab === 3 && (
        <div className="space-y-6 animate-fade-in max-w-5xl">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mb-1">
                <Clock className="w-3 h-3 text-emerald-700" />
                <span>Operating Schedule</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Weekly Operating Hours &amp; Schedule
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Accurate hours keep customer expectations aligned, update your Google Places profile, and reflect in your live customer review funnel.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveBusinessHours}
              disabled={isSavingHours}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-60 shrink-0 self-start md:self-auto"
            >
              {isSavingHours ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Operating Hours</span>
                </>
              )}
            </button>
          </div>

          {/* Success Toast */}
          {hoursSavedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Business hours updated and synced with your live customer review funnel!</span>
            </div>
          )}

          {/* Quick Schedule Presets */}
          <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-800">Quick Presets:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMondayToWeekdays}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Copy Monday to Weekdays (Mon-Fri)
              </button>
              <button
                type="button"
                onClick={handleSetAllStandardHours}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Set All 10:00 AM – 10:00 PM
              </button>
              <button
                type="button"
                onClick={handleSetAll24Hours}
                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Set All 24/7 Open
              </button>
            </div>
          </div>

          {/* 7-Day Interactive Schedule Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Weekly Schedule</h3>
                <p className="text-xs text-stone-500 mt-0.5">Toggle days open or closed and adjust opening/closing hours.</p>
              </div>
            </div>

            <div className="divide-y divide-stone-100">
              {schedule.map((item, idx) => (
                <div key={item.day} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/40 transition">
                  {/* Day & Open Toggle */}
                  <div className="flex items-center gap-3 w-48">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(idx)}
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                        item.isOpen ? "bg-emerald-800" : "bg-stone-300"
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full bg-white absolute top-1 shadow-xs transition-transform",
                          item.isOpen ? "right-1" : "left-1"
                        )}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{item.day}</span>
                      <span className={cn(
                        "text-[10px] font-semibold",
                        item.isOpen ? "text-emerald-700" : "text-stone-400"
                      )}>
                        {item.isOpen ? 'Open for business' : 'Closed'}
                      </span>
                    </div>
                  </div>

                  {/* Hours Inputs */}
                  {item.isOpen ? (
                    <div className="flex flex-wrap items-center gap-3 flex-1 justify-start sm:justify-end">
                      {item.is24Hours ? (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          Open 24 Hours
                        </span>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-stone-500">From</span>
                            <select
                              value={item.openTime}
                              onChange={(e) => handleChangeDayTime(idx, 'openTime', e.target.value)}
                              className="px-3 py-1.5 text-xs bg-slate-50 border border-stone-200 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-800 outline-none"
                            >
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-stone-500">To</span>
                            <select
                              value={item.closeTime}
                              onChange={(e) => handleChangeDayTime(idx, 'closeTime', e.target.value)}
                              className="px-3 py-1.5 text-xs bg-slate-50 border border-stone-200 rounded-lg text-slate-800 font-semibold focus:ring-1 focus:ring-emerald-800 outline-none"
                            >
                              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </>
                      )}

                      <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 cursor-pointer ml-2">
                        <input
                          type="checkbox"
                          checked={item.is24Hours}
                          onChange={() => handleToggle24Hours(idx)}
                          className="rounded text-emerald-800 focus:ring-emerald-800"
                        />
                        <span>24 Hours</span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-right flex-1">
                      <span className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-500 text-xs font-semibold">
                        Closed All Day
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Holiday Note & Customer Funnel Display */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Funnel Display Preferences &amp; Special Notice</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHoursInFunnel}
                  onChange={(e) => setShowHoursInFunnel(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-800"
                />
                <span>Display operating schedule badge in customer review funnel</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Announcement / Kitchen Timing Notice (Optional)
                </label>
                <textarea
                  rows={2}
                  value={scheduleNote}
                  onChange={(e) => setScheduleNote(e.target.value)}
                  placeholder="e.g. Kitchen closes 30 minutes before closing time. Takeaway available."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-800 outline-none font-medium"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Shown as a helpful note beneath opening hours on your digital menu and QR review page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACCOUNT & SECURITY MANAGEMENT */}
      {activeTab === 5 && (
        <div className="space-y-6 animate-fade-in max-w-4xl">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mb-1">
                <UserIcon className="w-3 h-3 text-emerald-700" />
                <span>Security &amp; Credentials</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Account Profile &amp; Security
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Manage your profile details, registered contact phone, active device sessions, and sign-in credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAccountProfile}
              disabled={isSavingAccount}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs disabled:opacity-60 shrink-0 self-start md:self-auto"
            >
              {isSavingAccount ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Account Profile</span>
                </>
              )}
            </button>
          </div>

          {/* Success Toasts */}
          {accountSavedSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Account profile details successfully updated and persisted!</span>
            </div>
          )}
          {passwordResetSent && (
            <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl text-blue-900 text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Password reset instructions sent to {email || 'your registered email'}!</span>
            </div>
          )}

          {/* Identity & Profile Details Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-stone-100">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-100 flex items-center justify-center font-bold text-xl shadow-xs">
                {(accountFullName || currentUser?.name || 'P')[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {accountFullName || currentUser?.name || 'Business Owner'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active Account
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Sign-in Email: <strong className="text-slate-800">{email || currentUser?.email || 'N/A'}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name / Contact Person
                </label>
                <input
                  type="text"
                  value={accountFullName}
                  onChange={(e) => setAccountFullName(e.target.value)}
                  placeholder="e.g. Anish Kumar"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-800 outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Mobile Phone
                </label>
                <input
                  type="tel"
                  value={accountPhoneInput}
                  onChange={(e) => setAccountPhoneInput(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-emerald-800 outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    readOnly
                    value={email || currentUser?.email || ''}
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-100/70 border border-stone-200 rounded-xl text-stone-600 font-medium cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Account Identifier (User ID)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUser?.id || 'usr_client'}
                    className="flex-1 px-3.5 py-2.5 text-xs bg-stone-100/70 border border-stone-200 rounded-xl text-stone-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleCopyAccountId}
                    className="p-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 transition cursor-pointer text-slate-700"
                    title="Copy Account ID"
                  >
                    {copiedAccountId ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Authentication */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base">Authentication &amp; Security Controls</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Password Reset</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Generate a secure password reset link dispatched to your registered email address.
                </p>
                <button
                  type="button"
                  onClick={handleRequestPasswordReset}
                  className="mt-2 px-3 py-1.5 rounded-lg border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-700 bg-white transition cursor-pointer"
                >
                  Send Password Reset Link
                </button>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>Active Device Session</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Current Session: Windows Desktop · Edge/Chrome Browser.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Session Active Now</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Sign Out of All Sessions</p>
                <p className="text-[11px] text-stone-500">Safely log out of this computer.</p>
              </div>
              <button
                type="button"
                onClick={handleSignOutAccount}
                className="px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SUBSCRIPTION, BILLING & INSTANT LICENSE KEY ACTIVATION */}
      {activeTab === 6 && (
        <div className="space-y-6 animate-fade-in max-w-5xl">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mb-1">
                <CreditCard className="w-3 h-3 text-emerald-700" />
                <span>License &amp; Plan Management</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Subscription, Plans &amp; License Key Activation
              </h2>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                Activate your dashboard instantly using an admin license key or review your active 2-year commercial plan status.
              </p>
            </div>

            <a
              href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I have a question regarding billing/license activation for ${activeBiz?.name || 'my business'}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer shadow-xs shrink-0 self-start md:self-auto"
            >
              <WhatsAppIcon />
              <span>Contact Billing Desk</span>
            </a>
          </div>

          {/* Current Plan Status Banner */}
          <div className={cn(
            "p-6 rounded-2xl border shadow-xs space-y-3",
            activeBiz?.planStatus === 'active'
              ? "bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white border-emerald-800"
              : "bg-amber-50/80 border-amber-200 text-slate-900"
          )}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    activeBiz?.planStatus === 'active'
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  )}>
                    {activeBiz?.planStatus === 'active' ? 'Active · 2-Year Full License' : '1-Day Free Evaluation Trial'}
                  </span>
                </div>
                <h3 className="text-lg font-bold">
                  {activeBiz?.planStatus === 'active'
                    ? 'All Systems Fully Activated & Unlimited'
                    : 'Trial Mode · Activation Required for Permanent Access'}
                </h3>
                <p className={cn(
                  "text-xs leading-relaxed max-w-xl",
                  activeBiz?.planStatus === 'active' ? "text-stone-300" : "text-amber-900"
                )}>
                  {activeBiz?.planStatus === 'active'
                    ? 'Your account has full commercial access to automated review routing, AI auto-reply, digital menu scans, and priority support.'
                    : 'Your trial gives a live demonstration of the customer funnel. Enter your admin-issued license key below to activate 2 full years.'}
                </p>
              </div>

              {activeBiz?.trialExpiresAt && (
                <div className={cn(
                  "p-3.5 rounded-xl border text-center shrink-0 min-w-[170px]",
                  activeBiz?.planStatus === 'active'
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-amber-200 text-amber-900"
                )}>
                  <span className="text-[10px] font-semibold block uppercase tracking-wider opacity-80">Validity / Expiry</span>
                  <strong className="text-xs font-bold mt-0.5 block">
                    {new Date(activeBiz.trialExpiresAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Instant License Key Activation Container */}
          {isAccountUpgradedInSettings ? (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">2-Year Commercial License Active</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">Your account has full commercial access to automated review routing, AI auto-reply, digital menu scans, and priority support.</p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shrink-0">
                Active · 2 Years
              </span>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-emerald-800/40 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Activate Dashboard with License Key
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Our core model: Admin issues a unique 2-year license key upon order confirmation. Enter it below to unlock your dashboard instantly.
                </p>
              </div>
            </div>

            <form onSubmit={handleActivateLicenseKey} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={licenseKeyInput}
                    onChange={(e) => {
                      setLicenseKeyInput(e.target.value.toUpperCase());
                      if (licenseKeyError) setLicenseKeyError(null);
                    }}
                    placeholder="ENTER LICENSE KEY (e.g. PX-XXXX-XXXX)"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-emerald-800 focus:bg-white rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 uppercase outline-none transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 uppercase">
                    2-Year Key
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isActivatingLicenseKey || !licenseKeyInput.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
                >
                  {isActivatingLicenseKey ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Activate Instantly</span>
                    </>
                  )}
                </button>
              </div>

              {licenseKeyError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{licenseKeyError}</span>
                </div>
              )}

              {licenseKeySuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{licenseKeySuccess}</span>
                </div>
              )}
            </form>
          </div>
          )}

          {/* Pricing Plans Overview (Both Plans Displayed in Full) */}
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Annual Commercial Plans</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Transparent 2-year pricing. Zero monthly subscriptions or hidden gateway charges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Plan 1: 2,599 Without NFC */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-stone-100 px-2 py-0.5 rounded">
                      Plan 1 · Software Suite
                    </span>
                    <span className="text-[10px] font-bold text-stone-600">2 Years License</span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹2,599</span>
                    <span className="text-xs text-slate-500 font-semibold">/ 2 Years</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    Without NFC Card · Full Software Suite
                  </p>

                  <div className="text-xs text-slate-600 space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Reply System Activated</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full QR Review Funnel Software Suite</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>2 Years Software License &amp; Unlimited Scans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Scan Analytics, Food Menu &amp; Catalog</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-400">
                      <span>✕ Without physical NFC smart tap card</span>
                    </div>
                  </div>
                </div>

                {isAccountUpgradedInSettings ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span>Plan Activated · 2-Year Commercial License</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGatewayPlan({
                        planId: 'plan_2year_software',
                        planName: 'Standard 2-Year Plan',
                        amount: 2599,
                      });
                      setShowGatewayModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pay & Activate Plan 1 Online (₹2,599)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Plan 2: 2,999 With NFC Card (Lifetime Deal for First 100 Accounts) */}
              <div className="bg-blue-50/60 rounded-2xl border-2 border-blue-600 p-6 shadow-md flex flex-col justify-between space-y-5 relative">
                <div className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  🔥 Lifetime Deal · First 100
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      Plan 2 · Software + NFC
                    </span>
                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      Lifetime Free
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-blue-900">₹2,999</span>
                    <span className="text-xs text-blue-700 font-bold">/ Lifetime Free</span>
                  </div>
                  <p className="text-xs font-semibold text-blue-800">
                    First 100 Accounts: Lifetime Free Access + NFC Review Card
                  </p>

                  {/* NFC Review Card Mockup */}
                  <div className="relative w-full h-24 my-3 rounded-xl overflow-hidden border border-blue-200 bg-stone-900">
                    <img
                      src="/products/nfc-review-card.jpg"
                      alt="NFC Review Card"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                        <span>NFC Smart Tap Review Card Included</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-blue-950 font-bold">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>First 100 Accounts: Lifetime Free Software Access</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-950 font-medium">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Custom NFC Smart Tap Review Card Included</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Reply System Activated for Life</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Zero Annual Renewal Fees Forever</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Free Express Doorstep Delivery Across India</span>
                    </div>
                  </div>
                </div>

                {isAccountUpgradedInSettings ? (
                  <div className="w-full py-3 px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 stroke-[3]" />
                    <span>License Active · Included in Account</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGatewayPlan({
                        planId: 'plan_pro_nfc_lifetime',
                        planName: 'Pro Plan + NFC Card (Lifetime Deal)',
                        amount: 2999,
                      });
                      setShowGatewayModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Claim & Pay Plan 2 Online (₹2,999)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Billing Receipts & Invoice Simulator */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Invoices &amp; Activation Records</h3>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
              <div className="p-3.5 bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                <span>Description / Item</span>
                <span>Invoice Action</span>
              </div>

              <div className="p-3.5 flex items-center justify-between text-xs hover:bg-stone-50/50 transition">
                <div>
                  <p className="font-bold text-slate-900">Platform Provisioning &amp; Funnel Setup</p>
                  <p className="text-[10px] text-stone-500">
                    Created {new Date(activeBiz?.createdAt || Date.now()).toLocaleDateString()} · Included
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice('Platform Provisioning & Funnel Setup')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Receipt</span>
                </button>
              </div>

              {activeBiz?.planStatus === 'active' && (
                <div className="p-3.5 flex items-center justify-between text-xs hover:bg-stone-50/50 transition">
                  <div>
                    <p className="font-bold text-slate-900">2-Year Commercial Software License</p>
                    <p className="text-[10px] text-stone-500">
                      Valid through {new Date(activeBiz.trialExpiresAt || Date.now()).toLocaleDateString()} · Active
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice('2-Year Commercial Software License')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Invoice</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Profile & Location Fetcher Modal */}
      {showGoogleLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowGoogleLinkModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-5 shrink-0">
              <div className="w-13 h-13 mx-auto mb-3 rounded-2xl bg-slate-50 text-emerald-700 flex items-center justify-center border border-slate-200 shadow-xs">
                <GoogleIcon />
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Google Business Profile &amp; Location Fetcher
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Fetch and auto-fill your customer Google Business Profile locations, verified address, phone, star ratings, and review routing links into your dashboard.
              </p>

              {/* Status Indicator */}
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap text-[11px]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  API Key Configured (AIzaSyDab...iPuJw)
                </span>
                {googleLiveActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    Google Places API (Live)
                  </span>
                )}
              </div>
            </div>

            {/* Tabs for Mode Selection */}
            <div className="flex border-b border-slate-200 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setGoogleActiveMode('search')}
                className={cn(
                  'flex-1 pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center justify-center gap-1.5',
                  googleActiveMode === 'search'
                    ? 'border-emerald-800 text-emerald-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Locations</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGoogleActiveMode('accounts');
                  if (googleAccountsList.length === 0) handleLoadGoogleAccounts();
                }}
                className={cn(
                  'flex-1 pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center justify-center gap-1.5',
                  googleActiveMode === 'accounts'
                    ? 'border-emerald-800 text-emerald-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Accounts to Activate</span>
              </button>
              <button
                type="button"
                onClick={() => setGoogleActiveMode('direct_link')}
                className={cn(
                  'flex-1 pb-2.5 text-xs font-bold transition border-b-2 cursor-pointer flex items-center justify-center gap-1.5',
                  googleActiveMode === 'direct_link'
                    ? 'border-emerald-800 text-emerald-950'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Manual Link</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {googleActiveMode === 'search' ? (
                <div className="space-y-4">
                  {/* Search Box */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Business Name, City, or Google Maps Link
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={googleSearchQuery}
                          onChange={(e) => setGoogleSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleFetchGoogleLocations();
                            }
                          }}
                          placeholder="e.g. Starbucks Mumbai, or Pizza Express, or paste Maps URL..."
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFetchGoogleLocations()}
                        disabled={isSearchingGoogle || !googleSearchQuery.trim()}
                        className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5 shadow-2xs"
                      >
                        {isSearchingGoogle ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Fetching...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Fetch Details</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Google Cloud Console Project Enablement Info (if needed) */}
                  {googleConsoleNotice && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Google Cloud Places API (New) Activation Notice</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        To enable direct live searching from Google servers, ensure <strong>Places API (New)</strong> is enabled on your Google Cloud Project (ID: <code>234396771853</code>).
                      </p>
                      <a
                        href="https://console.developers.google.com/apis/api/places.googleapis.com/overview?project=234396771853"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:underline pt-1"
                      >
                        <span>Open Google Cloud Console to Enable Places API (New)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Candidate Locations List */}
                  {googleCandidates.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Found Google Business Locations ({googleCandidates.length})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Click to select and import location details
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {googleCandidates.map((candidate, idx) => {
                          const isSelected = selectedCandidate?.placeId === candidate.placeId;
                          return (
                            <div
                              key={candidate.placeId || idx}
                              onClick={() => setSelectedCandidate(candidate)}
                              className={cn(
                                'p-3.5 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left',
                                isSelected
                                  ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-600/20'
                                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {candidate.photoUrl ? (
                                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100">
                                    <img
                                      src={candidate.photoUrl}
                                      alt={candidate.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
                                    <Store className="w-5 h-5" />
                                  </div>
                                )}

                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-slate-900">
                                      {candidate.name}
                                    </h4>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                      {candidate.category}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-xs">{candidate.address}</span>
                                  </div>

                                  <div className="flex items-center gap-3 pt-0.5 text-[11px]">
                                    <div className="flex items-center gap-1 font-bold text-amber-600">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      <span>{candidate.rating.toFixed(1)}</span>
                                      <span className="text-slate-400 font-normal">
                                        ({candidate.reviewCount} reviews)
                                      </span>
                                    </div>
                                    {candidate.phone && (
                                      <span className="text-slate-500 text-[10px]">
                                        📞 {candidate.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApplyGoogleProfile(candidate);
                                }}
                                disabled={isSavingGoogleLink}
                                className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-2xs self-end sm:self-auto flex items-center gap-1.5"
                              >
                                {isSavingGoogleLink && isSelected ? (
                                  <span>Importing...</span>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Import to Dashboard</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : googleActiveMode === 'accounts' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Accessible Google Accounts &amp; Locations
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Retrieved via My Business Account Management API
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleConnectGoogleOAuth}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-950 text-white text-[11px] font-bold hover:bg-emerald-900 transition cursor-pointer flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>OAuth Login</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadGoogleAccounts}
                        disabled={isLoadingAccounts}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {isLoadingAccounts ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <RefreshCw className="w-6 h-6 text-emerald-700 animate-spin mb-2" />
                      <p className="text-xs text-slate-600 font-semibold">
                        Fetching Business Profile accounts...
                      </p>
                    </div>
                  ) : googleAccountsList.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2.5">
                      <Store className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-800">No business profile attached to this email</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        No Google Business Profile was found attached to this email address. Make sure you authorize the exact Google email that manages your business on Google Maps.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleConnectGoogleOAuth}
                          className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Authorize with Google (OAuth)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadGoogleAccounts}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Fetch Accounts
                        </button>
                      </div>
                    </div>
                  ) : (
                    googleAccountsList.map((acc, aIdx) => (
                      <div key={acc.accountId || aIdx} className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-bold text-slate-900">{acc.accountName}</span>
                          <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {acc.locations.length} Locations Available
                          </span>
                        </div>

                        <div className="space-y-2">
                          {acc.locations.map((loc, lIdx) => (
                            <div
                              key={loc.locationId || lIdx}
                              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-600/50 hover:bg-emerald-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold text-slate-900">{loc.name}</h5>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    {loc.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{loc.address}</span>
                                </p>
                                <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                                  <span className="font-bold text-amber-600 flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span>{loc.rating.toFixed(1)}</span>
                                  </span>
                                  <span className="text-slate-400">({loc.reviewsCount} reviews)</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleApplyGoogleProfile({
                                    placeId: loc.locationId,
                                    locationId: loc.locationId,
                                    accountId: loc.accountId,
                                    name: loc.name,
                                    category: loc.category,
                                    categorySlug: loc.categorySlug,
                                    address: loc.address,
                                    city: loc.city,
                                    phone: loc.phone,
                                    website: loc.website,
                                    rating: loc.rating,
                                    reviewCount: loc.reviewsCount,
                                    photoUrl: loc.photoUrl,
                                    menuEnabled: loc.menuEnabled,
                                    servicesEnabled: loc.servicesEnabled,
                                    productsEnabled: loc.productsEnabled,
                                    googleMapsUri: loc.mapsUrl,
                                    reviewUrl: loc.reviewUrl,
                                  })
                                }
                                disabled={isSavingGoogleLink}
                                className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-2xs self-end sm:self-auto flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Activate Location</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Mode 2: Manual Direct Review URL */
                <form onSubmit={handleSaveGoogleLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Google Review URL or Place Link <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      autoFocus
                      value={googleInputUrl}
                      onChange={(e) => {
                        setGoogleInputUrl(e.target.value);
                        if (googleLinkError) setGoogleLinkError(null);
                      }}
                      placeholder="https://search.google.com/local/writereview?placeid=... or Maps link"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-normal">
                      Tip: In Google Maps, search for your business, tap &ldquo;Ask for reviews&rdquo;, and copy the review link.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingGoogleLink || !googleInputUrl.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      {isSavingGoogleLink ? (
                        <span>Verifying &amp; Saving...</span>
                      ) : (
                        <span>Save &amp; Connect Link</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Feedback Toasts inside Modal */}
              {googleLinkError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{googleLinkError}</span>
                </div>
              )}

              {googleLinkSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{googleLinkSuccess}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowGoogleLinkModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>

              {googleActiveMode === 'search' && selectedCandidate && (
                <button
                  type="button"
                  onClick={() => handleApplyGoogleProfile(selectedCandidate)}
                  disabled={isSavingGoogleLink}
                  className="py-2.5 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSavingGoogleLink ? (
                    <span>Applying...</span>
                  ) : (
                    <span>Apply Selected Location</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
const PinIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const RefreshIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const ClockIcon = () => <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const GoogleIcon = () => <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853"/><path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335"/></svg>;
const WhatsAppIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
