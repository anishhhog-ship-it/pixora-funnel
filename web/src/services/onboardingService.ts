import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { GoogleBusinessDetails } from './googlePlacesService';
import { GoogleBusinessLocation, GoogleConnectionStatus } from './googleBusinessProfileService';

export interface OnboardingState {
  // Navigation / Progressive section state
  currentSection: 'connect' | 'select_location' | 'confirm' | 'manual' | 'customize' | 'ready' | 'golive';
  lastCompletedSection: string;
  isCompleted: boolean;
  savedIndicator: boolean;
  lastSavedAt: string;

  // Google OAuth & Business Profile Connection
  googleConnected: boolean;
  googleConnectionStatus: GoogleConnectionStatus;
  googleAccountId?: string;
  googleLocationId?: string;
  googleError?: string | null;
  googleErrorType?: 'oauth_cancelled' | 'no_locations' | 'api_error' | null;
  availableLocations: GoogleBusinessLocation[];
  selectedLocation: GoogleBusinessLocation | null;

  // Manual fallback mode
  manualSetup: boolean;

  // Google link (optional fast lookup)
  googleUrl: string;
  isSearching: boolean;
  searchError: string | null;
  resolvedPlace: GoogleBusinessDetails | null;
  isConfirmed: boolean;

  // Business entity details
  businessId?: string;
  businessName: string;
  category: string;
  categorySlug: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  phone: string;
  website: string;
  googleRating: number;
  googleReviewCount: number;
  openingHours?: string;

  // Category-based capability toggles
  menuEnabled: boolean;
  servicesEnabled: boolean;
  productsEnabled: boolean;

  // Missing data & branding
  missingFields: string[];
  logoUrl: string;
  coverImageUrl: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;

  // Funnel & QR
  businessSlug: string;
  isSlugCustomized: boolean;
  isSlugValid: boolean;
  slugSuggestions: string[];
  funnelId?: string;
  funnelUrl: string;
  qrGenerated: boolean;

  // Backward compatibility with legacy step numbers
  currentStep: number;
  completedSteps: number[];
  fullName: string;
  email: string;
}

const STORAGE_KEY = 'pixora_smart_onboarding';
const LEGACY_STORAGE_KEY = 'pixora_progressive_onboarding';
const isBrowser = typeof window !== 'undefined';

export const defaultOnboardingState: OnboardingState = {
  currentSection: 'connect',
  lastCompletedSection: '',
  isCompleted: false,
  savedIndicator: false,
  lastSavedAt: new Date().toISOString(),

  googleConnected: false,
  googleConnectionStatus: 'not_connected',
  googleAccountId: undefined,
  googleLocationId: undefined,
  googleError: null,
  googleErrorType: null,
  availableLocations: [],
  selectedLocation: null,

  manualSetup: false,

  googleUrl: '',
  isSearching: false,
  searchError: null,
  resolvedPlace: null,
  isConfirmed: false,

  businessName: '',
  category: '',
  categorySlug: '',
  address: '',
  city: '',
  phone: '',
  website: '',
  googleRating: 4.8,
  googleReviewCount: 120,
  openingHours: 'Open now · 10:00 AM – 10:00 PM',

  menuEnabled: true,
  servicesEnabled: false,
  productsEnabled: false,

  missingFields: ['logo', 'tagline', 'primaryColor'],
  logoUrl: '',
  coverImageUrl: '',
  tagline: '',
  primaryColor: '#0B3D2E',
  secondaryColor: '#D4AF37',

  businessSlug: '',
  isSlugCustomized: false,
  isSlugValid: true,
  slugSuggestions: [],
  funnelUrl: '',
  qrGenerated: false,

  currentStep: 1,
  completedSteps: [],
  fullName: 'Business Owner',
  email: '',
};

/**
 * Intelligent Missing Data Engine
 * Identifies what fields need user input so we never re-ask for retrieved data
 */
export function getMissingBusinessFields(details: {
  name?: string;
  category?: string;
  address?: string;
  city?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  photoUrl?: string;
  tagline?: string;
  coverImageUrl?: string;
  primaryColor?: string;
}): string[] {
  const missing: string[] = [];

  // Core branding is usually missing from basic Google place snippets
  if (!details.logoUrl && !details.photoUrl) {
    missing.push('logo');
  }
  if (!details.tagline) {
    missing.push('tagline');
  }
  if (!details.primaryColor) {
    missing.push('primaryColor');
  }

  // Check if contact/details were omitted by Google
  if (!details.phone) {
    missing.push('phone');
  }
  if (!details.website) {
    missing.push('website');
  }
  if (!details.coverImageUrl && !details.photoUrl) {
    missing.push('coverImage');
  }

  return missing;
}

export const onboardingService = {
  /**
   * Utility to compute missing fields
   */
  getMissingFields: getMissingBusinessFields,
  getMissingBusinessFields,

  /**
   * Read state from LocalStorage or Supabase
   */
  getOnboardingState: (): OnboardingState => {
    if (!isBrowser) return defaultOnboardingState;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        let cleanedRaw = raw.replace(/brij[-_\s]*mantra/gi, 'Your Business');
        cleanedRaw = cleanedRaw.replace(/brij/gi, 'Your Business');
        const parsed = JSON.parse(cleanedRaw);
        if (parsed.businessName && /brij/i.test(parsed.businessName)) {
          parsed.businessName = 'Your Business';
        }
        if (parsed.businessSlug && /brij/i.test(parsed.businessSlug)) {
          parsed.businessSlug = 'your-business';
        }
        if (parsed.tagline && /brij/i.test(parsed.tagline)) {
          parsed.tagline = 'GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS';
        }
        return { ...defaultOnboardingState, ...parsed };
      }
    } catch (e) {
      console.error('Error reading onboarding state', e);
    }
    return defaultOnboardingState;
  },

  /**
   * Save onboarding progress with auto-save indicator support
   */
  saveOnboardingState: (partial: Partial<OnboardingState>): OnboardingState => {
    const current = onboardingService.getOnboardingState();
    const updated: OnboardingState = {
      ...current,
      ...partial,
      lastSavedAt: new Date().toISOString(),
      savedIndicator: true,
    };

    if (isBrowser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving onboarding state', e);
      }
    }

    // Async sync to Supabase onboarding_progress if user is logged in
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then((res: any) => {
        const authData = res?.data;
        if (authData?.user) {
          supabase.from('onboarding_progress').upsert({
            user_id: authData.user.id,
            current_step: updated.currentStep || 1,
            completed: updated.isCompleted,
            account_completed: true,
            business_completed: updated.isConfirmed || updated.googleConnected,
            category_completed: !!updated.category,
            branding_completed: !!updated.logoUrl || !!updated.primaryColor,
            funnel_completed: !!updated.funnelUrl,
            go_live_completed: updated.isCompleted,
            step_data: updated as any,
            updated_at: new Date().toISOString(),
          }).then(() => {});
        }
      }).catch(() => {});
    }

    return updated;
  },

  /**
   * Sync from Supabase if returning user on fresh device
   */
  syncFromSupabase: async (userId: string): Promise<OnboardingState | null> => {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data && data.step_data) {
        const remoteState = data.step_data as unknown as OnboardingState;
        if (remoteState) {
          onboardingService.saveOnboardingState(remoteState);
          return remoteState;
        }
      }
    } catch (err) {
      console.warn('Could not sync onboarding state from Supabase:', err);
    }
    return null;
  },

  /**
   * Reset onboarding
   */
  resetOnboarding: (): OnboardingState => {
    if (isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return defaultOnboardingState;
  },
};
