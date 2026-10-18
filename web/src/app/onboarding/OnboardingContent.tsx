'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Check, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Search, 
  ExternalLink, 
  Copy, 
  Download, 
  Printer, 
  Sparkles, 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Smartphone, 
  RefreshCw, 
  Palette, 
  Upload, 
  HelpCircle,
  Eye,
  Store,
  ChevronRight,
  Info,
  Building2,
  Lock,
  RotateCcw,
  ImageIcon,
  Sliders,
  TrendingUp,
  Camera,
  Zap,
  Bot,
  Mail,
  KeyRound,
  Send,
  UserCheck
} from 'lucide-react';

import { 
  googlePlacesService,
  GoogleBusinessDetails,
  googleBusinessProfileService,
  GoogleBusinessAccount,
  onboardingService,
  businessService,
  funnelService,
  qrService,
  trialService,
  authService,
  OnboardingState,
  normalizeBusinessCategory,
  getAllCategories,
  getCategoryConfidence,
  BUSINESS_CATEGORIES,
  DEFAULT_FUNNEL_BACKGROUND,
  BusinessCategoryConfig
} from '@/services';
import PwaInstallPrompt, { triggerPwaInstall } from '@/components/PwaInstallPrompt';

// Curated brand color palettes
const COLOR_PRESETS = [
  { name: 'Royal Emerald', primary: '#0B3D2E', secondary: '#D4AF37' },
  { name: 'Midnight Navy', primary: '#0F172A', secondary: '#38BDF8' },
  { name: 'Obsidian Amber', primary: '#18181B', secondary: '#F59E0B' },
  { name: 'Imperial Violet', primary: '#4C1D95', secondary: '#EC4899' },
  { name: 'Crimson Rose', primary: '#881337', secondary: '#FB7185' },
];

// Curated atmospheric background presets matching modern local businesses
const BACKGROUND_PRESETS = [
  {
    id: 'restaurant_dining',
    name: 'Restaurant Dining',
    category: 'Fine Dining & Restaurant',
    url: '/default-funnel-bg.jpg',
    tagline: 'GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS',
    badge: 'Top Choice',
    description: 'Warm ambient dining hall with tables, lamps, and culinary plating'
  },
  {
    id: 'fine_dining_luxury',
    name: 'Luxury Dining Hall',
    category: 'Restaurant & Bar',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=1200&fit=crop',
    tagline: 'Exceptional Cuisine & Ambient Dining',
    badge: 'Popular for Dining',
    description: 'Opulent chandeliers, warm wooden architecture, and candlelit tables'
  },
  {
    id: 'artisan_cafe',
    name: 'Artisan Cafe & Bakery',
    category: 'Cafe & Bistro',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&h=1200&fit=crop',
    tagline: 'Fresh Brews • Cozy Conversations',
    badge: 'Cafes',
    description: 'Rustic brickwork, espresso bar, and cozy seating'
  },
  {
    id: 'luxury_spa',
    name: 'Botanical Spa & Salon',
    category: 'Salon & Wellness',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&h=1200&fit=crop',
    tagline: 'Relaxation & Organic Self-Care',
    badge: 'Spa & Salons',
    description: 'Serene bamboo, soothing lighting, and natural wellness aesthetics'
  },
  {
    id: 'clinic_modern',
    name: 'Pristine Clinic & Dental',
    category: 'Clinic & Healthcare',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1600&h=1200&fit=crop',
    tagline: 'Compassionate Care & Healthy Smiles',
    badge: 'Healthcare',
    description: 'Bright, sterile, reassuring modern clinic interior'
  },
  {
    id: 'boutique_retail',
    name: 'Designer Boutique',
    category: 'Retail & Fashion',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=1200&fit=crop',
    tagline: 'Curated Elegance for Modern Living',
    badge: 'Retail',
    description: 'High-end apparel displays, minimalist architecture, and chic lighting'
  },
  {
    id: 'grand_hotel',
    name: 'Grand Hotel & Resort',
    category: 'Hotel & Hospitality',
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=1200&fit=crop',
    tagline: 'World-Class Hospitality & Stays',
    badge: 'Hotels',
    description: 'Five-star lobby lounge, architectural brilliance, and plush seating'
  },
  {
    id: 'fitness_studio',
    name: 'Fitness & Athletic Club',
    category: 'Gym & Sports',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=1200&fit=crop',
    tagline: 'Elevate Your Fitness & Well-Being',
    badge: 'Fitness',
    description: 'State-of-the-art training studio, neon motivation, and modern weights'
  },
];

// Luxury Lotus Floral SVG Mark (matches reference screenshot)
function LotusBrandIcon({ className = "w-10 h-10", fill = "#D4AF37" }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 14 C44 32 40 54 50 78 C60 54 56 32 50 14 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C36 60 28 42 36 24 C44 34 48 55 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C64 60 72 42 64 24 C56 34 52 55 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C24 68 16 50 22 36 C30 44 44 64 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C76 68 84 50 78 36 C70 44 56 64 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

export default function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lifecycle & Hydration
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState<'connect' | 'select_location' | 'confirm' | 'manual' | 'customize' | 'ready' | 'golive'>('connect');

  // Google Places API (New) State
  const [mapsInput, setMapsInput] = useState('');
  const [isResolvingPlaces, setIsResolvingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [resolvedPlace, setResolvedPlace] = useState<GoogleBusinessDetails | null>(null);
  const [placeCandidates, setPlaceCandidates] = useState<GoogleBusinessDetails[]>([]);
  const [googleAccounts, setGoogleAccounts] = useState<GoogleBusinessAccount[]>([]);
  const [isFetchingGoogleAccounts, setIsFetchingGoogleAccounts] = useState(false);
  const [showGoogleProfileModal, setShowGoogleProfileModal] = useState(false);
  const [googleModalMode, setGoogleModalMode] = useState<'search' | 'account' | 'link'>('search');
  const [googleModalSearchInput, setGoogleModalSearchInput] = useState('');
  const [selectorSearchQuery, setSelectorSearchQuery] = useState('');
  const [googleApiNotice, setGoogleApiNotice] = useState<string | null>(null);
  const [googleConsoleUrl, setGoogleConsoleUrl] = useState<string | null>(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Authentication & 1-Day Trial Activation Gate State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authIsSignUp, setAuthIsSignUp] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Manual fallback toggle
  const [manualMode, setManualMode] = useState(false);

  // Business fields
  const [businessName, setBusinessName] = useState('Your Business');
  const [category, setCategory] = useState('Pure Veg Restaurant');
  const [address, setAddress] = useState('Malviya Nagar');
  const [city, setCity] = useState('Jaipur');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('https://yourbusiness.com');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('/default-funnel-bg.jpg');
  const [tagline, setTagline] = useState('GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS');
  const [primaryColor, setPrimaryColor] = useState('#0B3D2E');
  const [secondaryColor, setSecondaryColor] = useState('#D4AF37');

  // Category Engine State
  const [categoryConfidence, setCategoryConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const allCategories = getAllCategories();
  const activeCategoryConfig = normalizeBusinessCategory(category);

  // Background Customization Controls
  const [bgTab, setBgTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [customUploadName, setCustomUploadName] = useState<string | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [vignetteStyle, setVignetteStyle] = useState<'ambient' | 'warm' | 'emerald' | 'minimal'>('ambient');
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Capability toggles influenced by category
  const [menuEnabled, setMenuEnabled] = useState(true);
  const [servicesEnabled, setServicesEnabled] = useState(false);
  const [productsEnabled, setProductsEnabled] = useState(false);

  // Handler for category selection / override
  const handleSelectCategory = (catConfig: BusinessCategoryConfig) => {
    // 1. Preload new background image immediately to avoid visual flashing
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = catConfig.backgroundImage;
    }

    setCategory(catConfig.name);
    setCategoryConfidence('high');
    setCoverImageUrl(catConfig.backgroundImage);
    setCustomUploadName(null);
    setPrimaryColor(catConfig.defaultPrimaryColor);
    setSecondaryColor(catConfig.defaultSecondaryColor);
    setTagline(catConfig.description);
    setMenuEnabled(catConfig.menuEnabled);
    setServicesEnabled(catConfig.servicesEnabled);
    setProductsEnabled(catConfig.productsEnabled);
    setShowCategoryModal(false);

    triggerAutoSave({
      category: catConfig.name,
      coverImageUrl: catConfig.backgroundImage,
      primaryColor: catConfig.defaultPrimaryColor,
      secondaryColor: catConfig.defaultSecondaryColor,
      tagline: catConfig.description,
      menuEnabled: catConfig.menuEnabled,
      servicesEnabled: catConfig.servicesEnabled,
      productsEnabled: catConfig.productsEnabled,
    });
  };

  // Funnel & Slug
  const [slug, setSlug] = useState('your-business');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'available' | 'taken'>('available');
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [isCreatingFunnel, setIsCreatingFunnel] = useState(false);
  const [funnelCreated, setFunnelCreated] = useState(false);
  const [liveFunnelUrl, setLiveFunnelUrl] = useState('');
  const [liveBusinessId, setLiveBusinessId] = useState('');

  // Interactive preview & UI
  const [previewRating, setPreviewRating] = useState(5);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [autoSavePulse, setAutoSavePulse] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // References for smooth scrolling
  const customizeSectionRef = useRef<HTMLDivElement>(null);
  const successSectionRef = useRef<HTMLDivElement>(null);

  const applyDeepLinkedCategory = (rawCategory: string, persist = false) => {
    const catConfig = normalizeBusinessCategory(rawCategory);
    const categoryPatch = {
      category: catConfig.name,
      coverImageUrl: catConfig.backgroundImage,
      primaryColor: catConfig.defaultPrimaryColor,
      secondaryColor: catConfig.defaultSecondaryColor,
      tagline: catConfig.description,
      menuEnabled: catConfig.menuEnabled,
      servicesEnabled: catConfig.servicesEnabled,
      productsEnabled: catConfig.productsEnabled,
    };

    setCategory(catConfig.name);
    setCategoryConfidence('high');
    setCoverImageUrl(catConfig.backgroundImage);
    setCustomUploadName(null);
    setPrimaryColor(catConfig.defaultPrimaryColor);
    setSecondaryColor(catConfig.defaultSecondaryColor);
    setTagline(catConfig.description);
    setMenuEnabled(catConfig.menuEnabled);
    setServicesEnabled(catConfig.servicesEnabled);
    setProductsEnabled(catConfig.productsEnabled);

    if (persist) onboardingService.saveOnboardingState(categoryPatch);
  };

  // 1. Initial State Restoration
  useEffect(() => {
    setMounted(true);
    setCurrentUser(authService.getCurrentUser());

    // Check if user requested a reset via URL (?reset=true or ?reset=1 or ?mode=add_location)
    if (searchParams.get('reset') === 'true' || searchParams.get('reset') === '1' || searchParams.get('mode') === 'add_location') {
      onboardingService.resetOnboarding();
      setBusinessName('Your Business');
      setTagline('GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS');
      const requestedCategory = searchParams.get('category')?.trim();
      if (requestedCategory) applyDeepLinkedCategory(requestedCategory, true);
      setSlug('your-business');
      setMapsInput('');
      setResolvedPlace(null);
      setCurrentSection('connect');
      return;
    }

    const requestedCategory = searchParams.get('category')?.trim();

    const saved = onboardingService.getOnboardingState();
    if (saved) {
      const cleanBizName = (saved.businessName || '')
        .replace(/brij[-_\s]*mantra/gi, 'Your Business')
        .replace(/brij/gi, 'Your Business')
        .trim();
      setBusinessName(cleanBizName || 'Your Business');
      if (saved.category) {
        setCategory(saved.category.replace(/brij[-_\s]*mantra/gi, 'Your Business').replace(/brij/gi, 'Your Business'));
      }
      if (saved.address) setAddress(saved.address);
      if (saved.city) setCity(saved.city);
      if (saved.phone) setPhone(saved.phone);
      if (saved.website) setWebsite(saved.website);
      if (saved.logoUrl) setLogoUrl(saved.logoUrl);
      if (saved.coverImageUrl && saved.coverImageUrl !== '/business-experience.png') {
        setCoverImageUrl(saved.coverImageUrl);
      } else {
        setCoverImageUrl('/default-funnel-bg.jpg');
      }
      const cleanTagline = (saved.tagline || '')
        .replace(/brij[-_\s]*mantra/gi, 'Your Business')
        .replace(/brij/gi, 'Your Business')
        .trim();
      setTagline(cleanTagline || 'GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS');
      if (saved.primaryColor) setPrimaryColor(saved.primaryColor);
      if (saved.secondaryColor) setSecondaryColor(saved.secondaryColor);
      if (saved.businessSlug) {
        const cleanSlug = saved.businessSlug.replace(/brij[-_]*/gi, '').trim() || 'your-business';
        setSlug(cleanSlug);
      }
      if (saved.selectedLocation) setResolvedPlace(saved.selectedLocation as any);
      if (saved.menuEnabled !== undefined) setMenuEnabled(saved.menuEnabled);
      if (saved.servicesEnabled !== undefined) setServicesEnabled(saved.servicesEnabled);
      if (saved.productsEnabled !== undefined) setProductsEnabled(saved.productsEnabled);
      if (saved.funnelUrl) setLiveFunnelUrl(saved.funnelUrl);
      if (saved.businessId) setLiveBusinessId(saved.businessId);

      // Section Navigation Priority:
      // Always start on Step 1 (Google Places Profile link setup) on page refresh so user can test the onboarding flow,
      // UNLESS explicitly navigating with ?step=customize or ?step=golive
      const stepParam = searchParams.get('step');
      if (stepParam === 'customize') {
        setCurrentSection('customize');
      } else if (stepParam === 'golive' && saved.isCompleted) {
        setFunnelCreated(true);
        setCurrentSection('golive');
      } else {
        // ALWAYS default to Step 1 (connect) on refresh!
        setCurrentSection('connect');
      }

      // An explicit category deep link is authoritative over stale local
      // progress, while still entering the same canonical onboarding UI.
      if (requestedCategory) applyDeepLinkedCategory(requestedCategory, true);

      // Check for Google OAuth callback parameters
      const googleStatus = searchParams.get('google_status');
      const googleMsg = searchParams.get('google_message');
      if (googleStatus === 'connected') {
        setGoogleApiNotice('Google Business Profile account authorized and connected successfully!');
      } else if (googleStatus === 'access_pending') {
        setGoogleApiNotice(
          googleMsg ||
          'Google Business Profile OAuth authorized! API access approval is currently pending. Location routing is active via direct Place link.'
        );
      } else if (googleStatus && googleStatus !== 'connected') {
        if (googleMsg) setGoogleApiNotice(googleMsg);
      }
    }
  }, [searchParams]);

  // 2. Slug Auto-generation
  useEffect(() => {
    if (!isSlugCustomized && businessName) {
      const generated = businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated || 'my-business');
    }
  }, [businessName, isSlugCustomized]);

  // 3. Slug Validation
  useEffect(() => {
    if (!slug) return;
    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    const isTaken = ['pixora', 'admin', 'dashboard', 'api', 'login'].includes(cleanSlug);
    if (isTaken) {
      setSlugStatus('taken');
      setSlugSuggestions([`${cleanSlug}-jaipur`, `${cleanSlug}-official`, `${cleanSlug}-hub`]);
    } else {
      setSlugStatus('available');
      setSlugSuggestions([]);
    }
  }, [slug]);

  // 4. Auto-save helper
  const triggerAutoSave = (patch: Partial<OnboardingState>) => {
    setAutoSavePulse(true);
    onboardingService.saveOnboardingState(patch);
    setTimeout(() => setAutoSavePulse(false), 800);
  };

  // Helper to apply a selected place to all onboarding fields
  const applySelectedPlace = (place: GoogleBusinessDetails) => {
    setResolvedPlace(place);
    setBusinessName(place.name);

    // Automatic category normalization & visual theme assignment
    const rawCategory = place.category || 'Other';
    const catConfig = normalizeBusinessCategory(rawCategory);
    const confidence = getCategoryConfidence(rawCategory);

    setCategory(catConfig.name);
    setCategoryConfidence(confidence);
    setAddress(place.address);
    setCity(place.city);
    if (place.phone) setPhone(place.phone);
    if (place.website) setWebsite(place.website);

    // Preload category background immediately
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = catConfig.backgroundImage;
    }

    // Auto-assign high quality category visuals & copy
    setCoverImageUrl(catConfig.backgroundImage);
    setPrimaryColor(catConfig.defaultPrimaryColor);
    setSecondaryColor(catConfig.defaultSecondaryColor);
    setTagline(catConfig.description);
    setMenuEnabled(catConfig.menuEnabled);
    setServicesEnabled(catConfig.servicesEnabled);
    setProductsEnabled(catConfig.productsEnabled);

    const generatedSlug = place.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug || 'my-business');

    triggerAutoSave({
      googleConnected: true,
      businessName: place.name,
      category: catConfig.name,
      address: place.address,
      city: place.city,
      phone: place.phone || '',
      website: place.website || '',
      coverImageUrl: catConfig.backgroundImage,
      tagline: catConfig.description,
      primaryColor: catConfig.defaultPrimaryColor,
      secondaryColor: catConfig.defaultSecondaryColor,
      businessSlug: generatedSlug,
      menuEnabled: catConfig.menuEnabled,
      servicesEnabled: catConfig.servicesEnabled,
      productsEnabled: catConfig.productsEnabled,
    });

    setCurrentSection('confirm');
  };

  // 5. Resolve Google Maps Profile Link / Business Name via Google Places API (New)
  const handleResolvePlaces = async (inputOverride?: string) => {
    const target = (inputOverride !== undefined ? inputOverride : mapsInput).trim();
    if (!target) {
      setPlacesError('Please enter your Google Maps profile link or business name.');
      return;
    }

    setIsResolvingPlaces(true);
    setPlacesError(null);
    setPlaceCandidates([]);

    try {
      const res = await googlePlacesService.searchBusiness(target);

      if (res.googleApiError) {
        setGoogleApiNotice(
          res.googleApiError.message ||
            'Google Places API (New) returned API_KEY_SERVICE_BLOCKED on project 234396771853.'
        );
        setGoogleConsoleUrl(
          res.googleConsoleUrl ||
            'https://console.cloud.google.com/apis/library/places.googleapis.com?project=234396771853'
        );
      } else {
        setGoogleApiNotice(null);
        setGoogleConsoleUrl(null);
      }

      if (res.candidates && res.candidates.length > 1) {
        setPlaceCandidates(res.candidates);
        setCurrentSection('select_location');
      } else if (res.place) {
        applySelectedPlace(res.place);
      } else {
        throw new Error('No matching places found. Try adding your city or area.');
      }
    } catch (err: any) {
      setPlacesError(err.message || 'Could not find business on Google Maps. Please check the link or search name.');
    } finally {
      setIsResolvingPlaces(false);
    }
  };

  // Fetch Accessible Google Business Profile Accounts via Business Information & Account Management API
  const handleFetchGoogleAccounts = async (queryOverride?: string) => {
    const target = (queryOverride || mapsInput || selectorSearchQuery || '').trim();
    if (target && target !== 'Your Business') {
      await handleResolvePlaces(target);
      return;
    }
    // If no search input provided, open discovery modal with all 3 clear options
    setGoogleModalSearchInput('');
    setShowGoogleProfileModal(true);
  };

  // 6. Confirm Location & Proceed to Customize
  const handleConfirmLocation = () => {
    setCurrentSection('customize');
    triggerAutoSave({ currentSection: 'customize' });
    setTimeout(() => {
      customizeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 8. Confirm Manual Details
  const handleConfirmManualDetails = () => {
    if (!businessName || !category || !city) return;
    const catConfig = normalizeBusinessCategory(category);
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = catConfig.backgroundImage;
    }
    setCategory(catConfig.name);
    setCoverImageUrl(catConfig.backgroundImage);
    setPrimaryColor(catConfig.defaultPrimaryColor);
    setSecondaryColor(catConfig.defaultSecondaryColor);
    setTagline(catConfig.description);
    setMenuEnabled(catConfig.menuEnabled);
    setServicesEnabled(catConfig.servicesEnabled);
    setProductsEnabled(catConfig.productsEnabled);

    setCurrentSection('customize');
    triggerAutoSave({
      manualSetup: true,
      businessName,
      category: catConfig.name,
      coverImageUrl: catConfig.backgroundImage,
      primaryColor: catConfig.defaultPrimaryColor,
      secondaryColor: catConfig.defaultSecondaryColor,
      tagline: catConfig.description,
      menuEnabled: catConfig.menuEnabled,
      servicesEnabled: catConfig.servicesEnabled,
      productsEnabled: catConfig.productsEnabled,
      city,
      phone,
      address,
      website,
      currentSection: 'customize',
    });
    setTimeout(() => {
      customizeSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 9. File Upload Handlers (Client-Side Instant FileReader)
  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBg(true);
    setCustomUploadName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCoverImageUrl(dataUrl);
        triggerAutoSave({ coverImageUrl: dataUrl });
      }
      setIsUploadingBg(false);
    };
    reader.onerror = () => setIsUploadingBg(false);
    reader.readAsDataURL(file);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
        triggerAutoSave({ logoUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  // 10. Funnel Generation Gate: Checks if user is authenticated and enforces 1 business per account quota
  const handleCreateFunnelClick = async () => {
    const currentUser = authService.getCurrentUser();
    const isAuthed = authService.isAuthenticated() && !!currentUser;

    if (!isAuthed) {
      // Login is strictly required to activate free trial!
      setAuthError(null);
      setAuthSuccessMsg(null);
      setShowAuthModal(true);
      return;
    }

    // Check 1-business limit per account rule
    const slotCheck = await businessService.canUserAddBusiness(currentUser.id);
    if (!slotCheck.allowed && slotCheck.reason === 'quota_reached') {
      const userBizs = await businessService.getBusinessesForUser(currentUser.id);
      const activeName = userBizs[0]?.name || 'your active shop';
      setAuthError(`This account already has an active business (${activeName}). Each account includes 1 business location on the standard plan. To connect an additional branch, please activate an additional shop license in your dashboard.`);
      setShowAuthModal(true);
      return;
    }

    executeCreateFunnelAndTrial(currentUser.id);
  };

  // 11. Execute Funnel Creation and Activate 1-Day Trial
  const executeCreateFunnelAndTrial = async (userId: string) => {
    if (!slug) return;
    setIsCreatingFunnel(true);

    try {
      const currentUser = authService.getCurrentUser();
      const userEmail = currentUser?.email || authEmail.trim() || '';
      if (currentUser && phone && !currentUser.phone) {
        authService.updateUserPhone(currentUser.id, phone);
      }

      // Persist business securely bound to this authenticated user
      const business = await businessService.createOrUpdateBusiness({
        name: businessName || 'My Business',
        userId: userId,
        ownerId: userId,
        email: userEmail,
        slug,
        category: category || 'Local Business',
        city: city || 'Jaipur',
        address: address || '',
        phone: phone || '',
        website: website || '',
        tagline: tagline || '',
        primaryColor,
        secondaryColor,
        logoUrl,
        coverImageUrl: coverImageUrl || '/default-funnel-bg.jpg',
        menuEnabled,
        servicesEnabled,
        googleMapsUrl: resolvedPlace?.googleMapsUri || website,
        googlePlaceId: resolvedPlace?.placeId || (resolvedPlace?.googleMapsUri ? 'https://maps.google.com' : undefined),
        googleReviewUrl:
          resolvedPlace?.placeId && resolvedPlace.placeId.startsWith('ChI')
            ? `https://search.google.com/local/writereview?placeid=${resolvedPlace.placeId}`
            : resolvedPlace?.googleMapsUri || website,
      });

      setLiveBusinessId(business.businessId);
      businessService.setActiveBusinessSlug(slug);

      // Persist location mapping to google_connections and google_integrations
      const finalReviewUrl =
        resolvedPlace?.placeId && resolvedPlace.placeId.startsWith('ChI')
          ? `https://search.google.com/local/writereview?placeid=${resolvedPlace.placeId}`
          : resolvedPlace?.googleMapsUri || website;

      if (business.businessId && finalReviewUrl) {
        try {
          await googleBusinessProfileService.linkGoogleProfile(business.businessId, {
            reviewUrl: finalReviewUrl,
            placeId: resolvedPlace?.placeId,
            mapsUrl: resolvedPlace?.googleMapsUri || website,
            accountId: (resolvedPlace as any)?.accountId,
            locationId: (resolvedPlace as any)?.locationId || resolvedPlace?.placeId,
          });
        } catch (linkErr) {
          console.warn('Could not persist Google link during onboarding completion:', linkErr);
        }
      }

      // Create Funnel
      await funnelService.createFunnel(business.businessId, slug);
      const computedFunnelUrl = qrService.getFunnelUrl(slug);
      setLiveFunnelUrl(computedFunnelUrl);

      // Start 1-Day Trial for this authenticated user and business
      await trialService.startTrial(userId, business.businessId);

      // Set Go Live State
      setFunnelCreated(true);
      setCurrentSection('golive');

      triggerAutoSave({
        isCompleted: true,
        businessId: business.businessId,
        funnelUrl: computedFunnelUrl,
        qrGenerated: true,
        currentSection: 'golive',
      });

      setTimeout(() => {
        successSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to create funnel:', err);
    } finally {
      setIsCreatingFunnel(false);
    }
  };

  // Google Sign-In Handler for Trial Activation
  const handleGoogleAuth = async () => {
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      const user = await authService.signInWithGoogle();
      if (!user) throw new Error('Google sign-in failed');

      // Check if user account already has an active business
      const slotCheck = await businessService.canUserAddBusiness(user.id);
      if (!slotCheck.allowed && slotCheck.reason === 'quota_reached') {
        const userBizs = await businessService.getBusinessesForUser(user.id);
        const activeName = userBizs[0]?.name || 'your active shop';
        setAuthError(`Welcome back! This account already has an active business (${activeName}). Each account includes 1 business location. You can manage it in your dashboard.`);
        return;
      }

      setCurrentUser(user);
      setShowAuthModal(false);
      await executeCreateFunnelAndTrial(user.id);
    } catch (err: any) {
      setAuthError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please enter both email and password.');
      return;
    }
    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      let user: any;
      if (authIsSignUp) {
        user = await authService.signUp({
          name: authName.trim() || businessName,
          email: authEmail.trim(),
          password: authPassword,
          phone: phone,
        });
      } else {
        user = await authService.login({
          email: authEmail.trim(),
          password: authPassword,
        });
      }
      if (user) {
        // Enforce 1-business per account quota
        const slotCheck = await businessService.canUserAddBusiness(user.id);
        if (!slotCheck.allowed && slotCheck.reason === 'quota_reached') {
          const userBizs = await businessService.getBusinessesForUser(user.id);
          const activeName = userBizs[0]?.name || 'your active shop';
          setAuthError(`Welcome back! This account already has an active business (${activeName}). Each account includes 1 business location.`);
          return;
        }

        setCurrentUser(user);
        setShowAuthModal(false);
        await executeCreateFunnelAndTrial(user.id);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // 12. Full Reset Handler (Clear saved state to test flow from scratch)
  const handleResetAll = () => {
    onboardingService.resetOnboarding();
    setBusinessName('Your Business');
    setCategory('Pure Veg Restaurant');
    setAddress('Malviya Nagar');
    setCity('Jaipur');
    setPhone('');
    setWebsite('https://yourbusiness.com');
    setLogoUrl('');
    setCoverImageUrl('/default-funnel-bg.jpg');
    setTagline('GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS');
    setPrimaryColor('#0B3D2E');
    setSecondaryColor('#D4AF37');
    setSlug('your-business');
    setMapsInput('');
    setResolvedPlace(null);
    setPlacesError(null);
    setManualMode(false);
    setFunnelCreated(false);
    setLiveFunnelUrl('');
    setCurrentSection('connect');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/onboarding');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50" suppressHydrationWarning>
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
          <span>Loading Smart Business Setup...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-800 antialiased flex flex-col justify-between" suppressHydrationWarning>
      
      {/* ========================================================================= */}
      {/* 1. MINIMAL HEADER                                                         */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between" suppressHydrationWarning>
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/pixora-logo.png"
              alt="Pixora Funnel by Pixora Automations"
              width={240}
              height={65}
              className="h-11 sm:h-13 md:h-14 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>
        </div>

        {/* Interactive Progress indicator Tabs */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
          <span className="text-stone-400">Setup Progress:</span>
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-full border border-stone-200">
            <button
              type="button"
              onClick={() => setCurrentSection('connect')}
              className={`px-3 py-1 rounded-full transition cursor-pointer text-xs ${
                currentSection === 'connect' || currentSection === 'confirm' || currentSection === 'manual'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-slate-900 hover:bg-stone-200/60'
              }`}
            >
              1. Business
            </button>
            <span className="text-stone-300 text-xs">→</span>
            <button
              type="button"
              onClick={() => setCurrentSection('customize')}
              className={`px-3 py-1 rounded-full transition cursor-pointer text-xs ${
                currentSection === 'customize'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-slate-900 hover:bg-stone-200/60'
              }`}
            >
              2. Customize
            </button>
            <span className="text-stone-300 text-xs">→</span>
            <button
              type="button"
              onClick={() => {
                if (funnelCreated) setCurrentSection('golive');
              }}
              className={`px-3 py-1 rounded-full transition text-xs ${
                currentSection === 'golive'
                  ? 'bg-emerald-900 text-white font-bold shadow-xs'
                  : funnelCreated
                  ? 'text-stone-600 hover:text-slate-900 hover:bg-stone-200/60 cursor-pointer'
                  : 'text-stone-400 cursor-not-allowed opacity-60'
              }`}
            >
              3. Go Live
            </button>
          </div>
        </div>

        {/* Top-Right: Reset Flow, Trial badge, Help & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            type="button" 
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs text-stone-700 hover:text-slate-900 transition font-medium cursor-pointer border border-stone-200/80 shadow-2xs"
            title="Reset onboarding and test from Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-semibold">Reset Flow</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">{funnelCreated ? 'Trial · Active (24h)' : '1-Day Free Trial'}</span>
          </div>

          <button 
            type="button" 
            onClick={() => setHelpModalOpen(true)}
            className="hidden sm:flex items-center gap-1 text-xs text-stone-600 hover:text-slate-900 transition font-medium cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need Help?</span>
          </button>

          {mounted && currentUser ? (
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setAuthSuccessMsg(null);
                setShowAuthModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              Log In
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN SETUP WORKSPACE                                                   */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ===================================================================== */}
          {/* LEFT COLUMN: SETUP WORKSPACE (7 COLS)                                 */}
          {/* ===================================================================== */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* HERO HEADING */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/60 px-2.5 py-0.5 rounded-md">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                {currentSection === 'customize' 
                  ? 'Funnel Customization' 
                  : currentSection === 'golive' 
                  ? 'Live & Activated' 
                  : 'Smart Business Setup'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                {currentSection === 'customize' 
                  ? 'Customize your review funnel.' 
                  : currentSection === 'golive' 
                  ? "Your funnel is ready for customers! 🎉" 
                  : "Let's get your business live."}
              </h1>
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl">
                {currentSection === 'customize'
                  ? 'Personalize your atmospheric photo, brand colors, and custom URL to match your in-store vibe.'
                  : currentSection === 'golive'
                  ? 'Your smart funnel and QR code are generated. Display them on tables to collect 5-star Google reviews.'
                  : "Enter your Google Maps profile link or search by business name and we'll automatically set up your funnel via Google Places API."}
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-stone-500 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Instant Google Places API setup. Login required to activate 1-Day Free Trial.</span>
              </div>
            </div>

            {/* SECTION 1: GOOGLE PLACES API LINK & SEARCH SETUP */}
            {!manualMode && currentSection === 'connect' && (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-2">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Google Places API Integration</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Connect your Google Business Profile
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed">
                    Fetch all accessible locations directly from your Google Business Profile account, or search by your business name and Google Maps link.
                  </p>
                </div>

                {/* Google Business Information & Account API Discovery Banner */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-xl shadow-xs border border-emerald-900/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                      <Store className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white">Google Business Profile Discovery</p>
                        <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                          Business Information API
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 mt-0.5">
                        Fetch your verified business profile &amp; locations from Google, or search your business on Google Maps.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGoogleProfileModal(true)}
                      className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Fetch with Google Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px bg-stone-200 flex-1"></div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Or Search by Business Name / Direct Maps Link
                  </span>
                  <div className="h-px bg-stone-200 flex-1"></div>
                </div>

                {/* Places Link / Search Input Box */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResolvePlaces();
                  }}
                  className="space-y-3"
                >
                  <div>
                    <div className="relative flex items-center">
                      <MapPin className="w-5 h-5 text-emerald-700 absolute left-4 pointer-events-none" />
                      <input
                        type="text"
                        value={mapsInput}
                        onChange={(e) => setMapsInput(e.target.value)}
                        placeholder="Paste Google Maps link (e.g. https://maps.app.goo.gl/...) or business name"
                        className="w-full pl-12 pr-36 py-3.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800 transition"
                      />
                      <div className="absolute right-2 flex items-center gap-1.5">
                        {mapsInput && (
                          <button
                            type="button"
                            onClick={() => setMapsInput('')}
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50 cursor-pointer text-xs"
                            title="Clear input"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isResolvingPlaces || !mapsInput.trim()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-40 cursor-pointer shadow-xs"
                        >
                          {isResolvingPlaces ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Fetching...</span>
                            </>
                          ) : (
                            <>
                              <span>Fetch Profile</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500 flex items-start sm:items-center gap-1.5 mt-2 px-1">
                      <span className="font-semibold text-emerald-800 shrink-0">💡 Pro Tip:</span>
                      <span>For instant 100% accuracy, include your city (e.g. &ldquo;Sharma Sweets, Jaipur&rdquo; or &ldquo;Blue Tokai, Bandra&rdquo;) or paste your direct Google Maps link.</span>
                    </p>
                  </div>

                  {/* Sample Business Chips for Instant Demo */}
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                      Quick Demo Samples (Click to test Places API live):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Taj Mahal Palace, Mumbai', query: 'The Taj Mahal Palace, Mumbai' },
                        { label: 'Blue Tokai Coffee, Bandra', query: 'Blue Tokai Coffee Roasters, Bandra' },
                        { label: 'Luxe Hair & Spa, Indiranagar', query: 'Luxe Hair & Wellness Spa, Indiranagar' },
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          disabled={isResolvingPlaces}
                          onClick={() => {
                            setMapsInput(chip.query);
                            handleResolvePlaces(chip.query);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-stone-200 text-stone-700 transition cursor-pointer"
                        >
                          <Search className="w-3 h-3 text-stone-400" />
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>

                {/* Error Banner */}
                {placesError && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2.5 animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold">Could not resolve Google Maps place</p>
                        <p className="text-amber-800 mt-0.5">{placesError}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleResolvePlaces('The Taj Mahal Palace, Mumbai')}
                        className="px-3 py-1 rounded-md bg-white border border-amber-300 text-xs font-semibold text-amber-900 hover:bg-amber-100/50 transition cursor-pointer"
                      >
                        Try Demo Place
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualMode(true)}
                        className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                      >
                        Enter details manually →
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Fallback Alternative */}
                <div className="pt-4 border-t border-stone-100 text-center sm:text-left space-y-2">
                  <div className="relative flex py-2 items-center">
                    <div className="grow border-t border-stone-200"></div>
                    <span className="shrink mx-4 text-xs uppercase font-medium text-stone-400">OR</span>
                    <div className="grow border-t border-stone-200"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        Don&apos;t have a Google Maps link yet?
                      </p>
                      <p className="text-xs text-stone-500">
                        Enter your basic business information manually and configure your funnel right away.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualMode(true)}
                      className="px-4 py-2 rounded-xl border border-stone-300 hover:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 transition cursor-pointer"
                    >
                      Set up manually
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MULTIPLE MATCHING CANDIDATES SELECTOR */}
            {!manualMode && currentSection === 'select_location' && (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1.5 border border-emerald-200/60">
                      <Store className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {placeCandidates.length > 0
                          ? `Locations Found (${placeCandidates.length})`
                          : 'Search Business Profile Locations'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Which location is yours?
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1">
                      {placeCandidates.length > 0 ? (
                        <>Showing Google Business Profile locations for &ldquo;<span className="font-semibold text-slate-800">{mapsInput || selectorSearchQuery || 'Your Search'}</span>&rdquo;. Select your exact branch below:</>
                      ) : (
                        <>Search your business name on Google Maps or sign in with Google to list your locations.</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentSection('connect');
                        setPlaceCandidates([]);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Setup</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Business Information API Search Bar */}
                <div className="p-4 bg-gradient-to-r from-stone-50 via-emerald-50/30 to-stone-50 rounded-2xl border border-stone-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Search &amp; List Businesses via Business Information API</span>
                    </span>
                    <span className="text-[11px] text-stone-400">Type exact shop name + city for best match</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <MapPin className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={selectorSearchQuery}
                        onChange={(e) => setSelectorSearchQuery(e.target.value)}
                        placeholder="Search your business name, area, or city (e.g. Blue Tokai Mumbai, Sharma Sweets Jaipur)..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800 transition"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (selectorSearchQuery.trim()) {
                              setMapsInput(selectorSearchQuery.trim());
                              handleResolvePlaces(selectorSearchQuery.trim());
                            }
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectorSearchQuery.trim()) {
                          setMapsInput(selectorSearchQuery.trim());
                          handleResolvePlaces(selectorSearchQuery.trim());
                        }
                      }}
                      disabled={isResolvingPlaces || !selectorSearchQuery.trim()}
                      className="px-5 py-2.5 bg-emerald-950 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                    >
                      {isResolvingPlaces ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Fetch Businesses</span>
                    </button>
                  </div>

                  {/* Connected Quick Action Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200/60">
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-800 transition shadow-2xs cursor-pointer"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>Sign In with Google Account (Sync Managed Businesses)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentSection('connect');
                        setPlaceCandidates([]);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 transition cursor-pointer"
                    >
                      Paste Maps Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setManualMode(true);
                        setCurrentSection('connect');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Set up manually →
                    </button>
                  </div>
                </div>

                {/* Candidate Cards */}
                {placeCandidates.length > 0 ? (
                  <div className="space-y-3">
                    {placeCandidates.map((cand, idx) => (
                      <div
                        key={cand.placeId || idx}
                        className="p-4 sm:p-5 rounded-xl border border-stone-200/90 hover:border-emerald-700/60 bg-stone-50/50 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-950 transition">
                              {cand.name}
                            </h3>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                              {cand.category}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 flex items-start sm:items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5 sm:mt-0" />
                            <span className="line-clamp-2 sm:line-clamp-1">{cand.address}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs">
                            <span className="font-bold text-amber-700 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              {cand.rating || 4.8} ★
                            </span>
                            <span className="text-stone-400">
                              ({cand.reviewCount || 100} Google reviews)
                            </span>
                            {cand.phone && (
                              <span className="text-stone-400 hidden sm:inline">· {cand.phone}</span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => applySelectedPlace(cand)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <span>Select This Business</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                    <Store className="w-8 h-8 text-stone-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-800">No business profile attached to this email</p>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      Use the search bar above to look up your business on Google Maps, or sign in with the exact Google account managing your business profile.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* CONFIRMATION CARD (GOOGLE PLACES RESOLVED PROFILE) */}
            {!manualMode && currentSection === 'confirm' && (resolvedPlace || businessName) && (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full ${resolvedPlace?.source === 'google_live_api' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'} flex items-center justify-center text-lg`}>
                      {resolvedPlace?.source === 'google_live_api' ? '🎉' : '🎯'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        {resolvedPlace?.source === 'google_live_api' ? 'Google Place Verified 🎉' : 'Smart Location Matched 🎯'}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {resolvedPlace?.source === 'google_live_api'
                          ? 'Profile details fetched successfully via Google Places API (New).'
                          : `Profile tailored dynamically for "${businessName}" in ${city}.`}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${resolvedPlace?.source === 'google_live_api' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-blue-800 bg-blue-50 border-blue-200'}`}>
                    <ShieldCheck className={`w-3.5 h-3.5 ${resolvedPlace?.source === 'google_live_api' ? 'text-emerald-600' : 'text-blue-600'}`} />
                    {resolvedPlace?.source === 'google_live_api' ? 'Verified' : 'Smart Match'}
                  </span>
                </div>

                {/* Google Cloud API Key Warning & Activation Guide (if Places API New is blocked or restricted) */}
                {googleApiNotice && (
                  <div className="p-4 rounded-xl border border-amber-200/90 bg-amber-50/70 text-xs text-amber-900 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none">⚠️</span>
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-950">
                          Google Cloud Notice: Places API (New) is restricted or not activated on project 234396771853 (<code>API_KEY_SERVICE_BLOCKED</code>).
                        </p>
                        <p className="text-amber-800">
                          Pixora automatically mapped your location to <strong>{city}</strong> with <strong>{category}</strong> branding. To enable 100% live Google Reviews and auto-sync directly from Google Maps:
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 pl-6">
                      <a
                        href={googleConsoleUrl || 'https://console.cloud.google.com/apis/library/places.googleapis.com?project=234396771853'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-2xs transition"
                      >
                        <span>Enable Places API (New) in Cloud Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href="https://console.cloud.google.com/apis/credentials?project=234396771853"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-medium transition"
                      >
                        <span>Check API Key Restrictions</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Verified Business Card */}
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {coverImageUrl ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-emerald-200 shadow-xs shrink-0 relative">
                        <img
                          src={coverImageUrl}
                          alt={businessName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-emerald-200 shadow-xs shrink-0 flex items-center justify-center">
                        <LotusBrandIcon className="w-10 h-10" fill="#D4AF37" />
                      </div>
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 truncate">
                          {businessName}
                        </h3>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full shrink-0">
                          {category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-stone-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{address ? `${address}, ${city}` : city}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsEditingAddress(!isEditingAddress)}
                          className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        >
                          {isEditingAddress ? 'Close' : 'Edit Address'}
                        </button>
                      </div>

                      {isEditingAddress && (
                        <div className="p-3 bg-white/95 rounded-xl border border-emerald-200/80 space-y-2 mt-2 shadow-2xs animate-fade-in">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                                Street / Area / Landmark
                              </label>
                              <input
                                type="text"
                                value={address}
                                onChange={(e) => {
                                  setAddress(e.target.value);
                                  triggerAutoSave({ address: e.target.value });
                                }}
                                placeholder="e.g. Linking Road, Bandra West"
                                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 focus:border-emerald-600 focus:outline-hidden bg-white text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                                City
                              </label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => {
                                  setCity(e.target.value);
                                  triggerAutoSave({ city: e.target.value });
                                }}
                                placeholder="e.g. Mumbai"
                                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 focus:border-emerald-600 focus:outline-hidden bg-white text-slate-800"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(false)}
                              className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                            >
                              Save Address
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {resolvedPlace?.rating || 4.8} ★
                        </span>
                        <span className="text-stone-500">
                          ({(resolvedPlace?.reviewCount || 120).toLocaleString()} reviews on Google)
                        </span>
                        {phone && (
                          <span className="text-stone-500">· {phone}</span>
                        )}
                      </div>
                      {website && (
                        <div className="pt-1">
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-800 font-medium hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 🌟 AUTOMATIC CATEGORY DETECTION & VISUAL MAPPING CARD 🌟 */}
                <div className="p-5 rounded-2xl border-2 border-emerald-900/20 bg-gradient-to-r from-emerald-50/90 via-white to-stone-50 space-y-3.5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          {categoryConfidence === 'high' ? '🎯 High Confidence Category' : categoryConfidence === 'medium' ? '✨ Category Detected' : '⚠️ Low Confidence Category'}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          Visual Theme: <strong className="text-slate-900 capitalize">{activeCategoryConfig.theme} Atmosphere</strong>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        We detected your business as: <span className="text-emerald-950 font-extrabold">{category}</span>
                      </h3>
                      <p className="text-xs text-stone-600">
                        Pixora automatically assigned a curated portrait atmosphere, {activeCategoryConfig.defaultFontStyle} typography, and &ldquo;{activeCategoryConfig.suggestedCTA}&rdquo; customer action.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-800 transition shadow-2xs cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Change Business Type</span>
                    </button>
                  </div>

                  {/* Low Confidence Quick Category Selector */}
                  {categoryConfidence === 'low' && (
                    <div className="pt-2 border-t border-emerald-100">
                      <p className="text-xs font-semibold text-slate-800 mb-2">
                        We couldn&apos;t confidently identify your business type. Please choose the closest category:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Restaurant', 'Cafe', 'Salon', 'Clinic', 'Retail', 'Hotel', 'Gym', 'Other'].map((catName) => {
                          const cfg = normalizeBusinessCategory(catName);
                          return (
                            <button
                              key={catName}
                              type="button"
                              onClick={() => handleSelectCategory(cfg)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 text-stone-700 transition cursor-pointer"
                            >
                              {catName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentSection('connect');
                      setResolvedPlace(null);
                    }}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    ← Search a Different Business
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLocation}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-950 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-900 transition shadow-xs cursor-pointer"
                  >
                    <span>Continue to Customize Funnel</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* MANUAL FALLBACK FORM */}
            {manualMode && (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Enter your business details
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Fast 4-field setup. You can always connect your Google Business Profile later in Settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManualMode(false)}
                    className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    Connect with Google instead →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        triggerAutoSave({ businessName: e.target.value });
                      }}
                      placeholder="e.g. Your Business"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        triggerAutoSave({ category: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                    >
                      <option value="">Select industry category...</option>
                      <option value="Restaurant & Fine Dining">Restaurant & Dining</option>
                      <option value="Artisanal Cafe & Bakery">Café & Bakery</option>
                      <option value="Luxury Hair Salon & Spa">Salon & Spa</option>
                      <option value="Clinic & Wellness Centre">Clinic & Healthcare</option>
                      <option value="Fitness & Sports Club">Gym & Fitness</option>
                      <option value="Retail Boutique & Lifestyle">Retail Store & Boutique</option>
                      <option value="Boutique Hotel & Stay">Hotel & Hospitality</option>
                      <option value="Local Business">Other Local Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        triggerAutoSave({ city: e.target.value });
                      }}
                      placeholder="e.g. Jaipur"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        triggerAutoSave({ phone: e.target.value });
                      }}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Address (Optional)</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        triggerAutoSave({ address: e.target.value });
                      }}
                      placeholder="e.g. Malviya Nagar"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Website (Optional)</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        triggerAutoSave({ website: e.target.value });
                      }}
                      placeholder="e.g. https://mybusiness.com"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={!businessName || !category || !city || !phone}
                    onClick={handleConfirmManualDetails}
                    className="px-5 py-2.5 rounded-xl bg-emerald-950 text-white text-xs font-semibold hover:bg-emerald-900 transition disabled:opacity-50 cursor-pointer"
                  >
                    Continue to Customize →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CUSTOMIZE BRANDING & BACKGROUND WORKFLOW */}
            {(currentSection === 'customize' || currentSection === 'ready') && (
              <div 
                ref={customizeSectionRef}
                className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-xs space-y-8 animate-fade-in"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentSection('connect')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                        title="Return to Step 1 Google Places link setup"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Step 1 (Google Places)</span>
                      </button>
                      <span className="text-stone-300">·</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                        Section 2 · Customization
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 font-medium">Step 2 of 3</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                    Make it yours.
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1">
                    Your customers will experience this atmospheric branding when they scan your table QR code.
                  </p>
                </div>

                {/* 🌟 YOUR FUNNEL STYLE: AUTOMATIC CATEGORY THEME BANNER 🌟 */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 text-white space-y-4 border border-slate-800 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          Your Funnel Style
                        </span>
                        <span className="text-xs text-stone-400">·</span>
                        <span className="text-xs text-stone-300">
                          Detected as <strong className="text-white">{category}</strong>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        We selected a visual style based on your business.
                      </h3>
                      <p className="text-xs text-stone-300 mt-0.5">
                        Recommended Style: <strong className="text-emerald-300 capitalize">{activeCategoryConfig.theme} Atmosphere</strong> · High-resolution 9:16 portrait photography.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Change Business Type</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Style Tokens Preview Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    {/* Background Preview */}
                    <div className="sm:col-span-2 relative h-28 rounded-xl overflow-hidden border border-white/15 bg-stone-900 group">
                      <img 
                        src={coverImageUrl || activeCategoryConfig.backgroundImage} 
                        alt="Category Visual" 
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3 flex flex-col justify-end">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          Recommended Category Visual
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {activeCategoryConfig.name} Atmosphere (Quality: 9.8/10)
                        </span>
                      </div>
                    </div>

                    {/* Palette & Font */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Palette &amp; Font</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: primaryColor }} title="Primary" />
                        <div className="w-5 h-5 rounded-full border border-white/30" style={{ backgroundColor: secondaryColor }} title="Secondary" />
                        <span className="text-xs text-stone-300 font-mono">{primaryColor}</span>
                      </div>
                      <p className="text-[11px] text-stone-300 capitalize">Typography: {activeCategoryConfig.defaultFontStyle}</p>
                    </div>

                    {/* Customer Action */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                      <span className="text-[10px] text-stone-400 uppercase font-semibold block">Customer Action</span>
                      <p className="text-xs font-bold text-emerald-300 truncate">{activeCategoryConfig.suggestedCTA}</p>
                      <p className="text-[10px] text-stone-400 truncate">Post-action: {activeCategoryConfig.postCompletionCTA}</p>
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* 🌟 DEDICATED BACKGROUND AMBIENCE WORKFLOW SUITE                   */}
                {/* ================================================================= */}
                <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-900/15 bg-stone-50/70 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
                        <ImageIcon className="w-4 h-4 text-emerald-700" />
                        <span>Funnel Background &amp; Atmosphere</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Select an ambient preset or upload your business photo. Updates phone preview instantly.
                      </p>
                    </div>

                    {/* Mode Switcher Tabs */}
                    <div className="flex items-center p-1 bg-stone-200/70 rounded-xl text-xs font-semibold self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setBgTab('presets')}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${bgTab === 'presets' ? 'bg-white text-slate-900 shadow-2xs' : 'text-stone-600 hover:text-slate-900'}`}
                      >
                        Atmosphere Presets
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBgTab('upload');
                          bgFileInputRef.current?.click();
                        }}
                        className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${bgTab === 'upload' ? 'bg-white text-slate-900 shadow-2xs' : 'text-stone-600 hover:text-slate-900'}`}
                      >
                        <Upload className="w-3 h-3 text-emerald-700" />
                        <span>Upload Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgTab('url')}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${bgTab === 'url' ? 'bg-white text-slate-900 shadow-2xs' : 'text-stone-600 hover:text-slate-900'}`}
                      >
                        Custom URL
                      </button>
                    </div>
                  </div>

                  {/* Active Background Banner with Live Thumbnail */}
                  <div className="relative rounded-xl overflow-hidden border border-stone-200 h-24 sm:h-28 flex items-center px-5 bg-slate-950">
                    <img 
                      src={coverImageUrl || '/default-funnel-bg.jpg'} 
                      alt="Active Background" 
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                    
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <div className="text-white space-y-0.5">
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-400/30">
                          <Check className="w-3 h-3" /> Live on Customer Funnel
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-white truncate max-w-xs">
                          {customUploadName || (BACKGROUND_PRESETS.find(p => p.url === coverImageUrl)?.name || 'Custom Atmosphere')}
                        </h4>
                        <p className="text-[11px] text-stone-300 hidden sm:block">
                          Full-bleed background with atmospheric lighting
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={bgFileInputRef}
                          onChange={handleBgFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => bgFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-semibold text-xs transition shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Change Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverImageUrl('/default-funnel-bg.jpg');
                            setCustomUploadName(null);
                            triggerAutoSave({ coverImageUrl: '/default-funnel-bg.jpg' });
                          }}
                          title="Reset to Default Background"
                          className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/20 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mode 1: Curated Atmosphere Presets Grid */}
                  {bgTab === 'presets' && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Select a Curated Atmosphere Preset:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {BACKGROUND_PRESETS.map((preset) => {
                          const isSelected = coverImageUrl === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setCoverImageUrl(preset.url);
                                setCustomUploadName(null);
                                triggerAutoSave({ coverImageUrl: preset.url });
                              }}
                              className={`group relative rounded-xl overflow-hidden border-2 text-left transition-all p-1.5 bg-white cursor-pointer ${
                                isSelected 
                                  ? 'border-emerald-800 ring-2 ring-emerald-800/20 shadow-md' 
                                  : 'border-stone-200 hover:border-stone-400 shadow-2xs'
                              }`}
                            >
                              <div className="relative h-20 w-full rounded-lg overflow-hidden bg-stone-900">
                                <img
                                  src={preset.url}
                                  alt={preset.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                    ✓
                                  </div>
                                )}
                                <span className="absolute bottom-1 left-1.5 text-[9px] font-semibold text-white/90 truncate max-w-[90%]">
                                  {preset.badge}
                                </span>
                              </div>
                              <div className="pt-1.5 px-0.5">
                                <p className="font-bold text-xs text-slate-900 truncate leading-tight">
                                  {preset.name}
                                </p>
                                <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                  {preset.category}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Upload Custom Photo */}
                  {bgTab === 'upload' && (
                    <div 
                      onClick={() => bgFileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-emerald-700 bg-white hover:bg-emerald-50/20 rounded-xl p-6 text-center cursor-pointer transition space-y-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5 text-emerald-700" />
                      </div>
                      <p className="text-xs font-semibold text-slate-900">
                        {isUploadingBg ? 'Reading photo...' : 'Click to browse or drop your business photo here'}
                      </p>
                      <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                        Supports JPG, PNG, WebP up to 10MB. Automatically optimized and rendered in full bleed.
                      </p>
                    </div>
                  )}

                  {/* Mode 3: Custom URL */}
                  {bgTab === 'url' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-stone-700">
                        Direct Image Web URL (Unsplash or CDN)
                      </label>
                      <input
                        type="url"
                        value={coverImageUrl}
                        onChange={(e) => {
                          setCoverImageUrl(e.target.value);
                          triggerAutoSave({ coverImageUrl: e.target.value });
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                      />
                    </div>
                  )}
                </div>

                {/* ================================================================= */}
                {/* LOGO, COLORS & TAGLINE                                            */}
                {/* ================================================================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  
                  {/* Business Logo with File Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-700">
                      Business Logo (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border border-stone-300 bg-stone-100 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <LotusBrandIcon className="w-8 h-8" fill="#D4AF37" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          onChange={handleLogoFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 hover:border-slate-800 text-xs font-semibold text-slate-800 bg-white transition cursor-pointer"
                          >
                            Upload File
                          </button>
                          {logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setLogoUrl('');
                                triggerAutoSave({ logoUrl: '' });
                              }}
                              className="text-[11px] text-rose-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={(e) => {
                            setLogoUrl(e.target.value);
                            triggerAutoSave({ logoUrl: e.target.value });
                          }}
                          placeholder="Or paste logo image link"
                          className="w-full px-2.5 py-1 bg-stone-50 border border-stone-200 rounded text-[11px] text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand Color Theme */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-700">
                      Brand Color &amp; Accent
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          triggerAutoSave({ primaryColor: e.target.value });
                        }}
                        className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          triggerAutoSave({ primaryColor: e.target.value });
                        }}
                        placeholder="#0B3D2E"
                        className="w-24 px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono uppercase text-slate-900"
                      />
                    </div>
                    {/* Swatches */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setPrimaryColor(p.primary);
                            setSecondaryColor(p.secondary);
                            triggerAutoSave({ primaryColor: p.primary, secondaryColor: p.secondary });
                          }}
                          title={p.name}
                          className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${primaryColor === p.primary ? 'scale-115 ring-2 ring-slate-900 shadow-xs' : 'hover:scale-105'}`}
                          style={{ backgroundColor: p.primary }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Brand Tagline */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Brand Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => {
                        setTagline(e.target.value);
                        triggerAutoSave({ tagline: e.target.value });
                      }}
                      placeholder="e.g. GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800 transition"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-stone-400 font-semibold uppercase">Presets:</span>
                      {[
                        'GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS',
                        'Experience Exceptional Care & Relaxation',
                        'Fresh Flavors • Unforgettable Moments',
                        'Curated Quality for Modern Living'
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTagline(t);
                            triggerAutoSave({ tagline: t });
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 cursor-pointer"
                        >
                          {t.length > 28 ? t.slice(0, 26) + '...' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* SECTION 3: FUNNEL SLUG & CREATION TRIGGER                         */}
                {/* ================================================================= */}
                <div className="pt-6 border-t border-stone-100 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Your Live Funnel Link
                    </label>
                    <div className="flex items-center rounded-xl border border-stone-300 bg-stone-50 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700/20 focus-within:border-emerald-800">
                      <span className="px-3.5 py-3 text-xs sm:text-sm text-stone-500 font-mono select-none bg-stone-100 border-r border-stone-200">
                        pixorafunnel.com/f/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setIsSlugCustomized(true);
                          const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setSlug(clean);
                          triggerAutoSave({ businessSlug: clean });
                        }}
                        placeholder="your-business"
                        className="flex-1 px-3 py-3 text-xs sm:text-sm font-mono text-slate-900 bg-transparent focus:outline-hidden"
                      />
                      <div className="pr-3">
                        {slugStatus === 'available' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3" /> Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Already taken
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      disabled={isCreatingFunnel || !slug}
                      onClick={handleCreateFunnelClick}
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-950 text-white font-semibold text-sm hover:bg-emerald-900 transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isCreatingFunnel ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Activating Free Trial &amp; QR Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Activate 1-Day Free Trial &amp; Generate QR</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Login required to activate 1-Day Free Trial pass. No credit card required.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: GO LIVE SUCCESS STATE */}
            {funnelCreated && (
              <div 
                ref={successSectionRef}
                className="bg-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      You&apos;re ready to go live. 🎉
                    </h2>
                    <p className="text-sm text-emerald-200/80 mt-1">
                      Your review funnel and dynamic scannable QR code are live and ready for customers.
                    </p>
                  </div>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {[
                    'Business connected',
                    'Funnel created',
                    'Atmosphere saved',
                    'QR generated',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-emerald-200/90 font-medium bg-emerald-900/50 px-2.5 py-1.5 rounded-lg border border-emerald-800/60">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* QR Display & Actions */}
                <div className="p-5 rounded-2xl bg-white text-slate-900 flex flex-col sm:flex-row items-center gap-6 shadow-md">
                  <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-xs shrink-0">
                    <QRCodeSVG
                      value={liveFunnelUrl || `https://funnel.pixoraautomations.com/f/${slug}`}
                      size={140}
                      level="H"
                      fgColor={primaryColor || '#0B3D2E'}
                    />
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 leading-tight">
                        {businessName} QR Standee
                      </h4>
                      <p className="text-xs text-stone-500 mt-0.5 font-mono break-all">
                        {liveFunnelUrl || `pixorafunnel.com/f/${slug}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(liveFunnelUrl || `https://funnel.pixoraautomations.com/f/${slug}`);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                      </button>

                      <a
                        href={liveFunnelUrl || `/f/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Live Funnel</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Action: Go to Dashboard & Install App */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-emerald-950 font-bold text-sm shadow-md hover:bg-emerald-50 transition"
                  >
                    <span>Open Business App (Dashboard)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => triggerPwaInstall()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App on Phone</span>
                  </button>

                  <a
                    href={`/f/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
                  >
                    <span>Live Customer Funnel</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="pt-2 text-center sm:text-left text-xs text-emerald-300/80 font-medium">
                  Trial · 23h 59m remaining · No credit card required.
                </div>
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: REAL-TIME FULL-BLEED SMARTPHONE PREVIEW (5 COLS)        */}
          {/* ===================================================================== */}
          <div className="hidden lg:block lg:col-span-5 sticky top-20">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  Live Review Funnel Preview
                </span>
                <span className="text-[11px] text-stone-400">Updates in real time</span>
              </div>

              {/* Smartphone Frame */}
              <div className="relative mx-auto w-[340px] rounded-[42px] bg-slate-950 p-3 shadow-2xl border-4 border-slate-800">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800" />
                </div>

                {/* Inner Screen: Exact Reference Screenshot Reproduction */}
                <div className="w-full h-[640px] rounded-[34px] overflow-hidden text-white flex flex-col relative select-none bg-stone-900">
                  
                  {/* Full-Bleed Atmospheric Background Image */}
                  <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                    <img
                      src={coverImageUrl || activeCategoryConfig.backgroundImage || DEFAULT_FUNNEL_BACKGROUND}
                      alt="Atmospheric Background"
                      className="w-full h-full object-cover object-center transition-all duration-300"
                    />
                    {/* Dark Ambient Vignette Overlay */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-black/90 backdrop-blur-[0.5px]" 
                      style={{ opacity: activeCategoryConfig.overlay.opacity }}
                    />
                  </div>

                  {/* Top Bar with Language Pill */}
                  <div className="relative z-10 pt-6 px-4 flex justify-end">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/20 text-white text-[10px] font-medium backdrop-blur-md">
                      <span>🌐</span>
                      <span>English</span>
                      <span className="text-[9px] opacity-70">⌄</span>
                    </div>
                  </div>

                  {/* Scrollable Funnel Body */}
                  <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-1 pb-4 flex flex-col items-center no-scrollbar">
                    
                    {/* Brand Header */}
                    <div className="flex flex-col items-center mb-4 text-center">
                      {logoUrl ? (
                        <div className="w-11 h-11 relative mb-1.5 rounded-xl overflow-hidden shadow-lg border border-white/25 bg-white/10 backdrop-blur-md">
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="mb-0.5">
                          <LotusBrandIcon className="w-9 h-9" fill={secondaryColor || activeCategoryConfig.defaultSecondaryColor} />
                        </div>
                      )}

                      <h3 
                        className="text-2xl font-serif font-bold tracking-tight text-[#F7F2E7] leading-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {businessName || 'Your Business'}
                      </h3>

                      <p 
                        className="text-[9px] tracking-[0.22em] uppercase font-semibold mt-0.5"
                        style={{ color: secondaryColor || activeCategoryConfig.defaultSecondaryColor }}
                      >
                        {category || activeCategoryConfig.name}
                      </p>

                      <p className="text-[8px] tracking-[0.18em] uppercase text-white/70 font-normal mt-1">
                        {tagline || activeCategoryConfig.description}
                      </p>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-4 text-white">
                      <h4 
                        className="text-xl font-serif font-bold text-[#FAF5EB] leading-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {activeCategoryConfig.headline}
                      </h4>
                      <p className="text-[10px] text-stone-200/90 leading-tight mt-1 max-w-[220px] mx-auto font-light">
                        {activeCategoryConfig.subheadline}
                      </p>
                    </div>

                    {/* Central Review Card (Exact Replica of Reference Screenshot) */}
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
                        style={{ backgroundColor: primaryColor || activeCategoryConfig.defaultPrimaryColor }}
                        className="w-full py-2.5 rounded-full text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>{activeCategoryConfig.suggestedCTA}</span>
                        <span>→</span>
                      </button>

                      {/* 3 Circular Micro-Features */}
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

                    {/* Join Our Happy Customers Pill Banner */}
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

                    {/* Wave Footer */}
                    <div className="w-full mt-auto pt-3 pb-1 text-center">
                      <p className="text-[10px] text-white/90 font-medium">
                        Powered by <span className="font-semibold text-white">Pixora Automations</span> ❤️
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. MOBILE PREVIEW FLOATING BUTTON & DRAWER                                */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-xs shadow-xl border border-white/20 active:scale-95 transition cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Preview Live Funnel</span>
        </button>
      </div>

      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end p-4 animate-fade-in">
          <div className="bg-slate-950 rounded-3xl p-4 max-w-sm mx-auto w-full max-h-[90vh] flex flex-col relative border border-white/20">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Live Review Funnel
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Inner Viewport */}
            <div className="relative flex-1 overflow-hidden rounded-2xl mt-3 h-[520px]">
              <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                <img
                  src={coverImageUrl || activeCategoryConfig.backgroundImage || DEFAULT_FUNNEL_BACKGROUND}
                  alt="Atmospheric Background"
                  className="w-full h-full object-cover object-center"
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-black/90" 
                  style={{ opacity: activeCategoryConfig.overlay.opacity }}
                />
              </div>

              <div className="relative z-10 p-4 h-full flex flex-col items-center justify-between overflow-y-auto no-scrollbar">
                <div className="text-center">
                  <LotusBrandIcon className="w-8 h-8 mx-auto mb-1" fill={secondaryColor || activeCategoryConfig.defaultSecondaryColor} />
                  <h3 className="text-xl font-serif font-bold text-white leading-tight">
                    {businessName || 'Your Business'}
                  </h3>
                  <p 
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: secondaryColor || activeCategoryConfig.defaultSecondaryColor }}
                  >
                    {category || activeCategoryConfig.name}
                  </p>
                </div>

                <div className="w-full bg-white rounded-2xl p-4 text-slate-900 my-auto text-center space-y-3">
                  <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center mx-auto">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
                      <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-xs">{activeCategoryConfig.headline}</h4>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                  <button 
                    style={{ backgroundColor: primaryColor || activeCategoryConfig.defaultPrimaryColor }}
                    className="w-full py-2 rounded-full text-white text-xs font-semibold"
                  >
                    {activeCategoryConfig.suggestedCTA} →
                  </button>
                </div>

                <p className="text-[10px] text-white/80">
                  Powered by Pixora Automations ❤️
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BUSINESS CATEGORY SELECTOR MODAL (ALL 25 CATEGORIES)                   */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-1">
                  <Store className="w-3 h-3 text-emerald-700" />
                  <span>25 Curated Visual Themes</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Select Your Business Category
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Choose the category that best matches your business to instantly apply curated 9:16 atmospheric photography, colors, and funnel copy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-4 bg-stone-50 border-b border-stone-200">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Search 25 categories (e.g. cafe, dentist, salon, gym, jewellery...)"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                />
              </div>
            </div>

            {/* Categories Grid */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 no-scrollbar">
              {allCategories
                .filter((cat) => {
                  if (!categorySearchQuery.trim()) return true;
                  const q = categorySearchQuery.toLowerCase();
                  return (
                    cat.name.toLowerCase().includes(q) ||
                    cat.theme.toLowerCase().includes(q) ||
                    cat.aliases.some((a) => a.toLowerCase().includes(q))
                  );
                })
                .map((cat) => {
                  const isCurrent = category.toLowerCase() === cat.name.toLowerCase() || category.toLowerCase() === cat.id.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer group ${
                        isCurrent
                          ? 'border-emerald-800 bg-emerald-50/60 ring-2 ring-emerald-800/20'
                          : 'border-stone-200 hover:border-emerald-700/60 hover:bg-stone-50'
                      }`}
                    >
                      <div className="w-12 h-14 rounded-xl overflow-hidden bg-stone-900 shrink-0 relative border border-stone-200">
                        <img
                          src={cat.backgroundImage}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {cat.name}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-emerald-800 capitalize font-medium">
                          Theme: {cat.theme}
                        </p>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5">
                          {cat.suggestedCTA} · {cat.defaultFontStyle} typography
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs text-stone-500">
                Selected category updates background, colors, font &amp; CTA immediately.
              </span>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HELP MODAL                                                             */}
      {/* ========================================================================= */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Need Help Setting Up?</h3>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Pixora Funnel helps you collect 5-star Google reviews on autopilot. During setup:
            </p>
            <ul className="text-xs text-stone-600 space-y-2 list-disc list-inside">
              <li><strong>Google Connection:</strong> Connects to your Google Business Profile to auto-import business details and configure table QR codes.</li>
              <li><strong>Background Ambience:</strong> Choose from our curated atmosphere gallery or upload your own interior/food photography.</li>
              <li><strong>Live Funnel Preview:</strong> See your customer experience live on the smartphone frame on the right.</li>
              <li><strong>1-Day Free Trial:</strong> Starts immediately with all features unlocked. No credit card required.</li>
            </ul>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LOGIN REQUIRED TO ACTIVATE FREE TRIAL MODAL                           */}
      {/* ========================================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 relative">
            <button
              type="button"
              onClick={() => {
                setShowAuthModal(false);
                setAuthError(null);
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-slate-900 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Free Trial Badge */}
            <div className="space-y-1.5 pr-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>1-Day Free Trial · Full Access</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Log In to Activate Your Free Trial
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Connect your account so your business profile, scannable QR codes, and review funnel are securely linked to your business.
              </p>
            </div>

            {/* Auth Method Tabs */}
            {/* Error & Success Alerts */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
                {authError.includes('already has an active business') && (
                  <div className="pt-1">
                    <Link
                      href="/dashboard"
                      className="w-full py-2 px-3 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center shadow-xs"
                    >
                      <span>Open Your Existing Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}
            {authSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* EMAIL & PASSWORD FLOW */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailAuth();
              }}
              className="space-y-3"
            >
              {authIsSignUp && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Vikram Joshi"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="owner@yourbusiness.in"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-stone-500">
                  {authIsSignUp ? 'Already have an account?' : 'New business owner?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthIsSignUp(!authIsSignUp);
                    setAuthError(null);
                  }}
                  className="font-semibold text-emerald-800 hover:underline cursor-pointer"
                >
                  {authIsSignUp ? 'Sign In instead' : 'Create an Account'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth || !authEmail.trim() || !authPassword.trim()}
                className="w-full py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm transition disabled:opacity-40 cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {isSubmittingAuth ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Activating Free Trial...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{authIsSignUp ? 'Create Account & Activate Trial' : 'Sign In & Activate Trial'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <span className="relative bg-white px-3 text-xs uppercase font-medium text-stone-400">
                OR
              </span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isSubmittingAuth}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:border-slate-800 hover:bg-stone-50 text-slate-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="pt-2 text-center text-[11px] text-stone-400">
              🔒 No credit card required. Free 24-hour pass begins immediately on sign-in.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. GOOGLE BUSINESS PROFILE DISCOVERY MODAL                                */}
      {/* ========================================================================= */}
      {showGoogleProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 relative">
            <button
              type="button"
              onClick={() => setShowGoogleProfileModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:text-slate-900 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 pr-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold">
                <Store className="w-3 h-3 text-emerald-700" />
                <span>Google Business Profile Hub</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                List &amp; Connect Your Business Locations
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Choose how you want to discover your business: search Google Maps by name, or connect your Google account to list the profiles you manage.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 p-1 bg-stone-100 rounded-xl text-xs font-semibold text-stone-600">
              <button
                type="button"
                onClick={() => setGoogleModalMode('search')}
                className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${
                  googleModalMode === 'search'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                1. Search Name
              </button>
              <button
                type="button"
                onClick={() => setGoogleModalMode('account')}
                className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${
                  googleModalMode === 'account'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                2. Google Sign-In
              </button>
              <button
                type="button"
                onClick={() => setGoogleModalMode('link')}
                className={`py-2 px-1 rounded-lg transition text-center cursor-pointer ${
                  googleModalMode === 'link'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                3. Direct Link
              </button>
            </div>

            {/* Mode 1: Search Business on Google Maps (Business Information API) */}
            {googleModalMode === 'search' && (
              <div className="space-y-3 animate-fade-in">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Enter Your Business Name or City:</span>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Business Information API
                  </span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={googleModalSearchInput}
                    onChange={(e) => setGoogleModalSearchInput(e.target.value)}
                    placeholder="e.g. Blue Tokai Bandra, Sharma Sweets Jaipur..."
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800 transition"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (googleModalSearchInput.trim()) {
                          const q = googleModalSearchInput.trim();
                          setMapsInput(q);
                          setSelectorSearchQuery(q);
                          setShowGoogleProfileModal(false);
                          handleResolvePlaces(q);
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-[11px] text-stone-500">
                  💡 Tip: Include your area or city for instant 100% precision (e.g. &ldquo;Hawa Mahal Cafe, Jaipur&rdquo;).
                </p>
                <button
                  type="button"
                  disabled={!googleModalSearchInput.trim() || isResolvingPlaces}
                  onClick={() => {
                    const q = googleModalSearchInput.trim();
                    setMapsInput(q);
                    setSelectorSearchQuery(q);
                    setShowGoogleProfileModal(false);
                    handleResolvePlaces(q);
                  }}
                  className="w-full py-3 bg-emerald-950 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResolvingPlaces ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search &amp; List Businesses</span>
                </button>
              </div>
            )}

            {/* Mode 2: Google Account OAuth Sync (Account Management API) */}
            {googleModalMode === 'account' && (
              <div className="space-y-4 animate-fade-in text-center p-3 bg-stone-50/70 rounded-2xl border border-stone-200">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-stone-200 flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900">
                    Live Google Business Profile Sync
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Sign in with your Google account to automatically list all business profiles &amp; store locations you own or manage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowGoogleProfileModal(false);
                    handleGoogleAuth();
                  }}
                  className="w-full py-3 px-4 bg-white border border-stone-300 hover:border-slate-800 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-50"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Connect Google Account &amp; Sync Locations</span>
                </button>
              </div>
            )}

            {/* Mode 3: Direct Maps Link or Place ID */}
            {googleModalMode === 'link' && (
              <div className="space-y-3 animate-fade-in">
                <label className="text-xs font-bold text-slate-800">
                  Paste Google Maps Share Link or Place ID:
                </label>
                <input
                  type="text"
                  value={googleModalSearchInput}
                  onChange={(e) => setGoogleModalSearchInput(e.target.value)}
                  placeholder="https://maps.app.goo.gl/... or ChIJ..."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-800 transition"
                />
                <button
                  type="button"
                  disabled={!googleModalSearchInput.trim() || isResolvingPlaces}
                  onClick={() => {
                    const q = googleModalSearchInput.trim();
                    setMapsInput(q);
                    setShowGoogleProfileModal(false);
                    handleResolvePlaces(q);
                  }}
                  className="w-full py-3 bg-emerald-950 hover:bg-emerald-900 text-white font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isResolvingPlaces ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Fetch Profile Details</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PWA Chrome Install Prompt & iOS Guide for Onboarding */}

      <PwaInstallPrompt source="onboarding" businessName={businessName} />

      {/* FOOTER */}
      <footer className="border-t border-stone-200/80 bg-white py-4 px-4 sm:px-8 text-center text-xs text-stone-400">
        Pixora Funnel by Pixora Automations · Smart Google Places Review Engine &amp; Standee Funnel System
      </footer>
    </div>
  );
}
