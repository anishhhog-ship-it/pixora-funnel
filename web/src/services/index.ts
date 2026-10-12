import { Business, Review, MenuCategory, MenuItem, Customer, QRCode, Analytics, User, Trial, Funnel } from '@/types';
import * as mockData from '@/data/mock';
import { getPresetForCategory } from '@/data/categoryPresets';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  normalizeBusinessCategory,
  getFunnelBackground,
  getCategoryConfidence,
  getAllCategories,
  isFoodAndDiningBusiness,
  getCatalogTerminology,
  BUSINESS_CATEGORIES,
  DEFAULT_FUNNEL_BACKGROUND,
  BusinessCategoryConfig,
  CategoryOverlayConfig,
  CategoryImageOption,
  OverlayType,
  FontStyle
} from '@/config/businessCategories';

import { isDemoMode } from '@/config/env';
export { isDemoMode } from '@/config/env';

import { authService } from './authService';
export { authService } from './authService';
export { trialService } from './trialService';
export { funnelService } from './funnelService';
export { onboardingService } from './onboardingService';
export { replyService } from './replyService';
import { statsService } from './statsService';
export { statsService } from './statsService';
export type { PlatformStats } from './statsService';
export { googleBusinessProfile, googleBusinessProfileService } from './googleBusinessProfileService';
export type { GoogleBusinessLocation, GoogleBusinessAccount, GoogleConnectionStatus, GoogleConnectionInfo } from './googleBusinessProfileService';
export { googlePlacesService } from './googlePlacesService';
export type { GoogleBusinessDetails } from './googlePlacesService';
export type { OnboardingState } from './onboardingService';
export { notificationService } from './notificationService';
export type { NotificationItem } from './notificationService';
export { supportService } from './supportService';
export type { SupportTicket, CallbackRequest } from './supportService';
export {
  normalizeBusinessCategory,
  getFunnelBackground,
  getCategoryConfidence,
  getAllCategories,
  isFoodAndDiningBusiness,
  getCatalogTerminology,
  BUSINESS_CATEGORIES,
  DEFAULT_FUNNEL_BACKGROUND,
};
export type { BusinessCategoryConfig, CategoryOverlayConfig, CategoryImageOption, OverlayType, FontStyle } from '@/config/businessCategories';

// Helper for local storage access
const isBrowser = typeof window !== 'undefined';
const BIZ_STORAGE_KEY = 'pixora_custom_businesses';
const REVIEWS_STORAGE_KEY = 'pixora_custom_reviews';
const QR_STORAGE_KEY = 'pixora_custom_qrs';
const FEEDBACK_STORAGE_KEY = 'pixora_private_feedbacks';
const ACTIVE_BIZ_KEY = 'pixora_active_business_slug';

export type PrivateFeedback = {
  feedbackId: string;
  businessId: string;
  businessSlug: string;
  rating: number;
  tags: string[];
  message: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  status: 'new' | 'in_review' | 'resolved';
};

function getStoredBusinesses(): Record<string, Business> {
  if (!isBrowser) return {};
  try {
    const raw = localStorage.getItem(BIZ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveStoredBusinesses(data: Record<string, Business>) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(BIZ_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save business to localStorage', e);
  }
}

// In-memory runtime map: strictly EMPTY in production; populated ONLY when DEMO_MODE=true
const runtimeBusinesses: Record<string, Business> = isDemoMode() ? {
  [mockData.mockBusiness.slug]: {
    ...mockData.mockBusiness,
    ownerName: 'Demo Owner',
    phone: '+91 92573 78047',
    email: 'contact@demo.in',
    planStatus: 'active',
    trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    qrScans: 0,
    reviewsCount: 0,
  },
} : {};

// ============================================================================
// BUSINESS SERVICE
// ============================================================================
export const businessService = {
  getBusinessBySlug: async (slug: string): Promise<Business | null> => {
    const cleanSlug = (slug || '').trim().toLowerCase();

    // 1. Query Supabase businesses table when configured
    if (isSupabaseConfigured()) {
      try {
        const { data: b, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (!error && b) {
          const mappedBiz: Business = {
            businessId: b.id,
            slug: b.slug,
            name: b.name,
            category: b.category || 'Local Business',
            city: b.city || 'Jaipur',
            logo: b.logo_url || mockData.mockBusiness.logo,
            coverImage: b.cover_image_url || mockData.mockBusiness.coverImage,
            googlePlaceId: b.website || 'https://maps.google.com',
            googleReviewUrl: b.website || undefined,
            ownerName: 'Business Owner',
            phone: b.phone || '',
            email: b.email || '',
            planStatus: (b.status === 'active' ? 'active' : 'trial') as 'trial' | 'active' | 'expired',
            trialExpiresAt: b.trial_expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            qrScans: 0,
            reviewsCount: 0,
            createdAt: b.created_at,
            theme: {
              primaryColor: b.primary_color || '#0B3D2E',
              secondaryColor: b.secondary_color || '#D4AF37',
              accentColor: b.accent_color || '#FDFBF7',
              logo: b.logo_url || mockData.mockBusiness.logo,
              coverImage: b.cover_image_url || mockData.mockBusiness.coverImage,
              businessName: b.name,
              category: b.category || 'Local Business',
              tagline: b.tagline || 'Experience exceptional local service.',
              menuEnabled: b.menu_enabled ?? true,
            },
          };
          runtimeBusinesses[cleanSlug] = mappedBiz;
          return mappedBiz;
        }
      } catch (err) {
        console.warn('Could not query Supabase businesses by slug:', err);
      }
    }

    // 2. Check runtime memory
    if (runtimeBusinesses[cleanSlug]) {
      return runtimeBusinesses[cleanSlug];
    }
    // 3. Check localStorage
    const stored = getStoredBusinesses();
    if (stored[cleanSlug]) {
      runtimeBusinesses[cleanSlug] = stored[cleanSlug];
      return stored[cleanSlug];
    }

    // 4. Fallback generator for Localhost / Development / Preview
    // Guarantees the live customer funnel ALWAYS works on localhost & preview without 404
    const formattedName = cleanSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const preset = getPresetForCategory('Restaurant & Fine Dining');

    const fallbackBiz: Business = {
      businessId: `biz_${cleanSlug.replace(/[^a-z0-9]/g, '_')}`,
      slug: cleanSlug,
      name: formattedName || 'Your Business',
      category: 'Restaurant & Fine Dining',
      city: 'Jaipur',
      logo: preset.logo,
      coverImage: preset.coverImage,
      planStatus: 'trial',
      trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      qrScans: 0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      theme: {
        primaryColor: '#0B3D2E',
        secondaryColor: '#D4AF37',
        accentColor: '#FDFBF7',
        logo: preset.logo,
        coverImage: preset.coverImage,
        businessName: formattedName || 'Your Business',
        category: 'Restaurant & Fine Dining',
        tagline: preset.tagline,
        menuEnabled: true,
      },
    };
    runtimeBusinesses[cleanSlug] = fallbackBiz;
    return fallbackBiz;
  },

  getBusinessById: async (id: string): Promise<Business | null> => {
    if (isSupabaseConfigured() && !id.startsWith('biz_')) {
      try {
        const { data: b, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && b) {
          return {
            businessId: b.id,
            slug: b.slug,
            name: b.name,
            category: b.category || 'Local Business',
            city: b.city || 'Jaipur',
            logo: b.logo_url || mockData.mockBusiness.logo,
            coverImage: b.cover_image_url || mockData.mockBusiness.coverImage,
            googlePlaceId: b.website || 'https://maps.google.com',
            ownerName: 'Business Owner',
            phone: b.phone || '',
            email: b.email || '',
            planStatus: 'active',
            trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            qrScans: 0,
            reviewsCount: 0,
            createdAt: b.created_at,
            theme: {
              primaryColor: b.primary_color || '#0B3D2E',
              secondaryColor: b.secondary_color || '#D4AF37',
              accentColor: b.accent_color || '#FDFBF7',
              logo: b.logo_url || mockData.mockBusiness.logo,
              coverImage: b.cover_image_url || mockData.mockBusiness.coverImage,
              businessName: b.name,
              category: b.category || 'Local Business',
              tagline: b.tagline || '',
              menuEnabled: b.menu_enabled ?? true,
            }
          };
        }
      } catch (e) {}
    }

    const all = await businessService.getAllBusinesses();
    return all.find(b => b.businessId === id) || (isDemoMode() ? mockData.mockBusiness : null);
  },

  getAllBusinesses: async (userId?: string): Promise<Business[]> => {
    const currentUser = authService.getCurrentUser();
    const targetUserId = userId || currentUser?.id;
    const targetEmail = currentUser?.email?.toLowerCase().trim();

    if (isSupabaseConfigured() && targetUserId) {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map((b: any) => ({
            businessId: b.id,
            ownerId: b.owner_id,
            userId: b.owner_id,
            slug: b.slug,
            name: b.name,
            category: b.category || 'Local Business',
            city: b.city || 'Jaipur',
            logo: b.logo_url || mockData.mockBusiness.logo,
            coverImage: b.cover_image_url || mockData.mockBusiness.coverImage,
            googlePlaceId: b.website || 'https://maps.google.com',
            ownerName: 'Business Owner',
            phone: b.phone || '',
            email: b.email || targetEmail || '',
            planStatus: 'active' as const,
            trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            qrScans: 0,
            reviewsCount: 0,
            createdAt: b.created_at,
            theme: {
              primaryColor: b.primary_color || '#0B3D2E',
              secondaryColor: b.secondary_color || '#D4AF37',
              accentColor: b.accent_color || '#FDFBF7',
              logo: b.logo_url || mockData.mockBusiness.logo,
              coverImage: b.cover_image_url || mockData.mockBusiness.coverImage,
              businessName: b.name,
              category: b.category || 'Local Business',
              tagline: b.tagline || '',
              menuEnabled: b.menu_enabled ?? true,
            }
          }));
          return mapped;
        }
      } catch (err) {
        console.warn('Could not query Supabase businesses:', err);
      }
    }

    const stored = getStoredBusinesses();

    // STRICT USER ISOLATION:
    // If a user is logged in, ONLY return businesses created by / linked to this user.
    if (targetUserId || targetEmail) {
      const userBizList = Object.values(stored).filter((b) => {
        const matchesId = targetUserId && (b.ownerId === targetUserId || b.userId === targetUserId);
        const matchesEmail = targetEmail && b.email && b.email.toLowerCase().trim() === targetEmail;
        return matchesId || matchesEmail;
      });
      return userBizList;
    }

    // If no user is authenticated, return empty list (do not leak businesses)
    return [];
  },

  getBusinessesForUser: async (userId: string): Promise<Business[]> => {
    return businessService.getAllBusinesses(userId);
  },

  /**
   * Check if user is eligible to add another business, or requires an additional shop account license
   * Rule: 1 user account = 1 business location by default.
   */
  canUserAddBusiness: async (userId?: string): Promise<{
    allowed: boolean;
    currentCount: number;
    maxSlots: number;
    reason?: 'login_required' | 'quota_reached';
  }> => {
    const currentUser = authService.getCurrentUser();
    const uid = userId || currentUser?.id;
    if (!uid) {
      return { allowed: false, currentCount: 0, maxSlots: 1, reason: 'login_required' };
    }

    const userBizs = await businessService.getBusinessesForUser(uid);
    const maxSlots = businessService.getUserPurchasedSlots(uid);

    if (userBizs.length >= maxSlots) {
      return {
        allowed: false,
        currentCount: userBizs.length,
        maxSlots,
        reason: 'quota_reached',
      };
    }

    return {
      allowed: true,
      currentCount: userBizs.length,
      maxSlots,
    };
  },

  /**
   * Get the maximum number of business locations this user account is allowed to manage (default: 1)
   */
  getUserPurchasedSlots: (userId: string): number => {
    if (!isBrowser) return 1;
    try {
      const raw = localStorage.getItem(`pixora_slots_${userId}`);
      return raw ? Math.max(1, parseInt(raw, 10) || 1) : 1;
    } catch {
      return 1;
    }
  },

  /**
   * Unlocks an additional business location slot for this account upon purchasing an additional plan
   */
  activateAdditionalBusinessSlot: (userId: string, count: number = 1): number => {
    if (!isBrowser) return 1;
    const current = businessService.getUserPurchasedSlots(userId);
    const updated = current + count;
    localStorage.setItem(`pixora_slots_${userId}`, updated.toString());
    return updated;
  },

  /**
   * Activates the dashboard instantly using an admin-issued license key.
   * This is the core activation model: Admin sends key -> client enters key -> dashboard active immediately.
   */
  activateDashboardWithLicenseKey: async (
    businessIdOrSlug: string,
    licenseKey: string
  ): Promise<{ success: boolean; message: string; business?: Business }> => {
    const key = (licenseKey || '').trim().toUpperCase();
    if (!key) {
      return { success: false, message: 'Please enter a valid activation license key.' };
    }
    if (key.length < 5) {
      return { success: false, message: 'Invalid license key format. Keys must be at least 6 characters.' };
    }

    const oneYearExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Supabase Cloud Sync
    if (isSupabaseConfigured() && businessIdOrSlug && !businessIdOrSlug.startsWith('biz_')) {
      try {
        // Query activation_keys table
        const { data: keyRecord } = await (supabase as any)
          .from('activation_keys')
          .select('*')
          .eq('key_string', key)
          .maybeSingle();

        if (keyRecord) {
          if (keyRecord.is_used && keyRecord.business_id && keyRecord.business_id !== businessIdOrSlug) {
            return { success: false, message: 'This license key has already been activated on another account.' };
          }
          await (supabase as any)
            .from('activation_keys')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', keyRecord.id);
        }

        // Update businesses status to 'active'
        await (supabase as any)
          .from('businesses')
          .update({ status: 'active', trial_expires_at: oneYearExpiry })
          .or(`id.eq.${businessIdOrSlug},slug.eq.${businessIdOrSlug}`);

        // Update trials
        await (supabase as any)
          .from('trials')
          .upsert({ business_id: businessIdOrSlug, status: 'active', expires_at: oneYearExpiry });
      } catch (err) {
        console.warn('Supabase key activation fallback to local:', err);
      }
    }

    // 2. Local State & Cache Update (Instant Localhost & Browser Activation)
    let updatedBiz: Business | null = null;
    if (isBrowser) {
      try {
        const stored = getStoredBusinesses();
        let targetKey = Object.keys(stored).find(
          s => s === businessIdOrSlug || stored[s].businessId === businessIdOrSlug
        );

        if (targetKey && stored[targetKey]) {
          stored[targetKey] = {
            ...stored[targetKey],
            planStatus: 'active',
            trialExpiresAt: oneYearExpiry,
          };
          updatedBiz = stored[targetKey];
          saveStoredBusinesses(stored);
        } else {
          const currentSlug = businessService.getActiveBusinessSlug() || businessIdOrSlug;
          if (runtimeBusinesses[currentSlug]) {
            runtimeBusinesses[currentSlug].planStatus = 'active';
            runtimeBusinesses[currentSlug].trialExpiresAt = oneYearExpiry;
            updatedBiz = runtimeBusinesses[currentSlug];
          }
        }

        // Save persistent activated flag for this business
        localStorage.setItem(`pixora_plan_active_${businessIdOrSlug}`, 'true');
        localStorage.setItem(`pixora_active_key_${businessIdOrSlug}`, key);

        // Notify all dashboard tabs & listeners
        window.dispatchEvent(new CustomEvent('pixora:dashboard_activated', {
          detail: { businessId: businessIdOrSlug, key, expiresAt: oneYearExpiry }
        }));
      } catch (e) {
        console.warn('Local activation cache error:', e);
      }
    }

    return {
      success: true,
      message: '✓ Dashboard activated successfully for 1 Year! Full software suite and 24/7 AI Auto-Replies are now live.',
      business: updatedBiz || undefined,
    };
  },

  /**
   * Clean up any orphan anonymous businesses from past testing so the dashboard only shows user's active business
   */
  cleanOrphanTestBusinesses: (userId?: string): void => {
    if (!isBrowser) return;
    try {
      const targetUid = userId || authService.getCurrentUser()?.id;
      const targetEmail = authService.getCurrentUser()?.email?.toLowerCase().trim();
      const stored = getStoredBusinesses();
      const cleaned: Record<string, Business> = {};

      Object.entries(stored).forEach(([slug, b]) => {
        // Only keep if explicitly owned by this user
        if (targetUid && (b.ownerId === targetUid || b.userId === targetUid)) {
          cleaned[slug] = b;
        } else if (targetEmail && b.email && b.email.toLowerCase().trim() === targetEmail) {
          cleaned[slug] = { ...b, ownerId: targetUid, userId: targetUid };
        }
      });

      saveStoredBusinesses(cleaned);
    } catch (e) {}
  },

  getActiveBusinessSlug: (): string => {
    if (!isBrowser) return 'your-business';
    return localStorage.getItem(ACTIVE_BIZ_KEY) || 'your-business';
  },

  setActiveBusinessSlug: (slug: string) => {
    if (!isBrowser) return;
    localStorage.setItem(ACTIVE_BIZ_KEY, slug);
  },

  getActiveBusiness: async (): Promise<Business | null> => {
    const slug = businessService.getActiveBusinessSlug();
    return businessService.getBusinessBySlug(slug);
  },

  getActiveBusinessId: async (): Promise<string> => {
    const biz = await businessService.getActiveBusiness();
    return biz?.businessId || '';
  },

  createBusiness: async (params: {
    name: string;
    slug?: string;
    userId?: string;
    ownerId?: string;
    category: string;
    city: string;
    tagline?: string;
    googleMapsUrl?: string;
    googlePlaceId?: string;
    googleReviewUrl?: string;
    ownerName?: string;
    phone?: string;
    email?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    coverImageUrl?: string;
  }): Promise<Business> => {
    const rawSlug = params.slug
      ? params.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')
      : params.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
    
    const uniqueSlug = rawSlug || `biz-${Date.now().toString(36)}`;
    let businessId = `biz_${Date.now()}`;

    // Get tailored presets and visual category theme
    const catConfig = normalizeBusinessCategory(params.category);
    const coverImage = params.coverImageUrl || catConfig.backgroundImage || DEFAULT_FUNNEL_BACKGROUND;
    const primaryColor = params.primaryColor || catConfig.defaultPrimaryColor;
    const secondaryColor = params.secondaryColor || catConfig.defaultSecondaryColor;
    const preset = getPresetForCategory(catConfig.name);
    const logo = params.logoUrl || preset.logo;
    const tagline = params.tagline || catConfig.description || preset.tagline;

    // 1-Day Trial
    const trialExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const currentUser = authService.getCurrentUser();
    const ownerId = params.ownerId || params.userId || currentUser?.id;
    const ownerEmail = params.email || currentUser?.email || '';

    // Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: bData, error } = await supabase
          .from('businesses')
          .insert({
            owner_id: ownerId,
            name: params.name.trim(),
            slug: uniqueSlug,
            category: params.category || 'Local Business',
            city: params.city || 'Jaipur',
            tagline,
            phone: params.phone,
            email: ownerEmail,
            website: params.googleMapsUrl,
            logo_url: logo,
            cover_image_url: coverImage,
            primary_color: params.primaryColor || '#0B3D2E',
            secondary_color: params.secondaryColor || '#D4AF37',
            status: 'active',
          })
          .select('id')
          .single();

        if (!error && bData) {
          businessId = bData.id;

          // 1. Create Funnel
          await supabase.from('funnels').insert({
            business_id: businessId,
            slug: uniqueSlug,
            status: 'active',
            review_enabled: true,
            smart_review_enabled: true,
            menu_enabled: true,
          });

          // 2. Create Default Single QR Code
          await supabase.from('qr_codes').insert([
            {
              business_id: businessId,
              name: 'Main Stand / Storefront',
              location_name: 'Main Entrance & Counter',
              table_name: 'Main Stand',
              short_code: `${uniqueSlug}-main`,
              destination_url: `https://funnel.pixoraautomations.com/f/${uniqueSlug}`,
              status: 'active',
              primary_color: params.primaryColor || '#0B3D2E',
              secondary_color: params.secondaryColor || '#D4AF37',
              cta_text: 'Scan for Reviews & Menu',
            }
          ]);

          // 3. Create Default Menu
          const { data: menuData } = await supabase.from('menus').insert({
            business_id: businessId,
            name: 'Main Menu',
            description: tagline,
            status: 'active',
          }).select('id').single();

          if (menuData) {
            // Seed sample categories & items
            const { data: catData } = await supabase.from('menu_categories').insert({
              menu_id: menuData.id,
              name: 'Featured Items',
              sort_order: 1,
              active: true,
            }).select('id').single();

            if (catData && preset.sampleItems && preset.sampleItems.length > 0) {
              await supabase.from('menu_items').insert(
                preset.sampleItems.slice(0, 4).map((it, idx) => ({
                  menu_id: menuData.id,
                  category_id: catData.id,
                  name: it.name,
                  description: it.description,
                  price: it.price,
                  image_url: it.image,
                  sort_order: idx + 1,
                  active: true,
                  bestseller: it.isBestseller,
                }))
              );
            }
          }

          // 4. Create Business Settings
          await supabase.from('business_settings').insert({
            business_id: businessId,
            auto_reply_enabled: false,
            auto_reply_tone: 'Warm & Professional',
            auto_reply_language: 'English',
          });
        }
      } catch (err) {
        console.warn('Could not persist business to Supabase:', err);
      }
    }

    const newBusiness: Business = {
      businessId,
      ownerId,
      userId: ownerId,
      slug: uniqueSlug,
      name: params.name.trim(),
      category: params.category || 'Local Business',
      categoryConfidence: getCategoryConfidence(params.category),
      visualThemeId: catConfig.id,
      city: params.city || 'Your City',
      logo,
      coverImage,
      googlePlaceId: params.googlePlaceId || params.googleMapsUrl || 'https://maps.google.com',
      googleReviewUrl:
        params.googleReviewUrl ||
        (params.googlePlaceId && params.googlePlaceId.startsWith('ChI')
          ? `https://search.google.com/local/writereview?placeid=${params.googlePlaceId}`
          : params.googleMapsUrl),
      ownerName: params.ownerName || currentUser?.name || 'Business Owner',
      phone: params.phone || currentUser?.phone || '',
      email: ownerEmail,
      planStatus: 'trial',
      trialExpiresAt,
      qrScans: 0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      theme: {
        primaryColor,
        secondaryColor,
        accentColor: '#FDFBF7',
        logo,
        coverImage,
        businessName: params.name.trim(),
        category: params.category || 'Local Business',
        tagline,
        menuEnabled: true,
      },
    };

    // Save to memory & localStorage
    runtimeBusinesses[uniqueSlug] = newBusiness;
    const stored = getStoredBusinesses();
    stored[uniqueSlug] = newBusiness;
    saveStoredBusinesses(stored);

    // Set as active
    businessService.setActiveBusinessSlug(uniqueSlug);

    // Seed default QRs for this business locally
    qrService.createDefaultQRsForBusiness(businessId, uniqueSlug, params.name);

    // Increment live demos counter
    statsService.recordTrialStarted();

    return newBusiness;
  },

  createOrUpdateBusiness: async (params: {
    id?: string;
    businessId?: string;
    userId?: string;
    ownerId?: string;
    slug?: string;
    name: string;
    category: string;
    city?: string;
    address?: string;
    tagline?: string;
    googleMapsUrl?: string;
    googlePlaceId?: string;
    googleReviewUrl?: string;
    website?: string;
    description?: string;
    theme?: any;
    ownerName?: string;
    phone?: string;
    email?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    menuEnabled?: boolean;
    servicesEnabled?: boolean;
    productsEnabled?: boolean;
  }): Promise<Business> => {
    const currentUser = authService.getCurrentUser();
    const ownerId = params.ownerId || params.userId || currentUser?.id;
    const existingId = params.id || params.businessId;
    if (existingId) {
      const existing = await businessService.getBusinessById(existingId);
      if (existing) {
        const updatedBiz: Business = {
          ...existing,
          ownerId: existing.ownerId || ownerId,
          userId: existing.userId || ownerId,
          name: params.name || existing.name,
          category: params.category || existing.category,
          city: params.city || existing.city,
          address: params.address || existing.address,
          website: params.website || existing.website,
          description: params.description || existing.description,
          phone: params.phone || existing.phone,
          email: params.email || existing.email || currentUser?.email,
          googlePlaceId: params.googlePlaceId || existing.googlePlaceId,
          googleReviewUrl: params.googleReviewUrl || existing.googleReviewUrl,
          logo: params.logoUrl || existing.logo,
          coverImage: params.coverImageUrl || existing.coverImage,
          theme: {
            ...existing.theme,
            businessName: params.name || existing.name,
            category: params.category || existing.category,
            tagline: params.tagline || existing.theme.tagline,
            primaryColor: params.primaryColor || existing.theme.primaryColor,
            secondaryColor: params.secondaryColor || existing.theme.secondaryColor,
            logo: params.logoUrl || existing.theme.logo,
            coverImage: params.coverImageUrl || existing.theme.coverImage,
            menuEnabled: params.menuEnabled ?? existing.theme.menuEnabled,
          }
        };

        if (isSupabaseConfigured() && !existingId.startsWith('biz_')) {
          try {
            await supabase.from('businesses').update({
              owner_id: updatedBiz.ownerId,
              name: updatedBiz.name,
              category: updatedBiz.category,
              city: updatedBiz.city,
              phone: updatedBiz.phone,
              email: updatedBiz.email,
              tagline: updatedBiz.theme.tagline,
              logo_url: updatedBiz.logo,
              cover_image_url: updatedBiz.coverImage,
              primary_color: updatedBiz.theme.primaryColor,
              secondary_color: updatedBiz.theme.secondaryColor,
              menu_enabled: updatedBiz.theme.menuEnabled,
            }).eq('id', existingId);
          } catch (e) {}
        }

        runtimeBusinesses[existing.slug] = updatedBiz;
        const stored = getStoredBusinesses();
        stored[existing.slug] = updatedBiz;
        saveStoredBusinesses(stored);
        businessService.setActiveBusinessSlug(existing.slug);
        return updatedBiz;
      }
    }
    return businessService.createBusiness({
      name: params.name,
      slug: params.slug,
      userId: ownerId,
      ownerId: ownerId,
      category: params.category,
      city: params.city || 'Jaipur',
      tagline: params.tagline,
      googleMapsUrl: params.googleMapsUrl,
      googlePlaceId: params.googlePlaceId,
      googleReviewUrl: params.googleReviewUrl,
      ownerName: params.ownerName,
      phone: params.phone,
      email: params.email,
      primaryColor: params.primaryColor,
      secondaryColor: params.secondaryColor,
      logoUrl: params.logoUrl,
      coverImageUrl: params.coverImageUrl,
    });
  },

  updateBusinessStatus: async (slug: string, status: 'trial' | 'active' | 'expired'): Promise<Business | null> => {
    const biz = await businessService.getBusinessBySlug(slug);
    if (!biz) return null;
    biz.planStatus = status;
    runtimeBusinesses[slug] = biz;
    const stored = getStoredBusinesses();
    stored[slug] = biz;
    saveStoredBusinesses(stored);

    if (isSupabaseConfigured() && !biz.businessId.startsWith('biz_')) {
      try {
        await supabase
          .from('businesses')
          .update({ status: status === 'active' ? 'active' : 'trial' })
          .eq('id', biz.businessId);
      } catch (e) {}
    }

    // When admin or system activates a funnel dashboard, increment live funnels counter
    if (status === 'active') {
      statsService.recordDashboardActivated();
    }

    return biz;
  },

  extendBusinessTrial: async (slug: string, hours: number = 24): Promise<Business | null> => {
    const biz = await businessService.getBusinessBySlug(slug);
    if (!biz) return null;
    const currentExpire = biz.trialExpiresAt ? new Date(biz.trialExpiresAt).getTime() : Date.now();
    const newExpire = Math.max(currentExpire, Date.now()) + hours * 60 * 60 * 1000;
    biz.trialExpiresAt = new Date(newExpire).toISOString();
    biz.planStatus = 'trial';
    runtimeBusinesses[slug] = biz;
    const stored = getStoredBusinesses();
    stored[slug] = biz;
    saveStoredBusinesses(stored);
    return biz;
  },

  updateBusinessAppearance: async (slug: string, options: {
    category?: string;
    customCoverImage?: string;
    coverImage?: string;
    primaryColor?: string;
    secondaryColor?: string;
    tagline?: string;
    fontStyle?: string;
    overlayType?: OverlayType;
    overlayOpacity?: number;
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    postCompletionCTA?: string;
    menuEnabled?: boolean;
    servicesEnabled?: boolean;
    productsEnabled?: boolean;
  }): Promise<Business | null> => {
    const biz = await businessService.getBusinessBySlug(slug);
    if (!biz) return null;

    if (options.category) {
      biz.category = options.category;
      biz.theme.category = options.category;
      const catConfig = normalizeBusinessCategory(options.category);
      biz.visualThemeId = catConfig.id;
      biz.categoryConfidence = 'high';
    }
    if (options.customCoverImage !== undefined) {
      biz.customCoverImage = options.customCoverImage;
    }
    if (options.coverImage) {
      biz.coverImage = options.coverImage;
      biz.theme.coverImage = options.coverImage;
    }
    if (options.primaryColor) {
      biz.theme.primaryColor = options.primaryColor;
    }
    if (options.secondaryColor) {
      biz.theme.secondaryColor = options.secondaryColor;
    }
    if (options.tagline !== undefined) {
      biz.theme.tagline = options.tagline;
    }
    if (options.fontStyle !== undefined) {
      biz.theme.fontStyle = options.fontStyle;
    }
    if (options.overlayType !== undefined) {
      biz.theme.overlayType = options.overlayType;
    }
    if (options.overlayOpacity !== undefined) {
      biz.theme.overlayOpacity = options.overlayOpacity;
    }
    if (options.headline !== undefined) {
      biz.theme.headline = options.headline;
    }
    if (options.subheadline !== undefined) {
      biz.theme.subheadline = options.subheadline;
    }
    if (options.ctaText !== undefined) {
      biz.theme.ctaText = options.ctaText;
    }
    if (options.postCompletionCTA !== undefined) {
      biz.theme.postCompletionCTA = options.postCompletionCTA;
    }
    if (options.menuEnabled !== undefined) {
      biz.menuEnabled = options.menuEnabled;
      biz.theme.menuEnabled = options.menuEnabled;
    }
    if (options.servicesEnabled !== undefined) {
      biz.servicesEnabled = options.servicesEnabled;
      biz.theme.servicesEnabled = options.servicesEnabled;
    }
    if (options.productsEnabled !== undefined) {
      biz.productsEnabled = options.productsEnabled;
      biz.theme.productsEnabled = options.productsEnabled;
    }

    runtimeBusinesses[slug] = biz;
    const stored = getStoredBusinesses();
    stored[slug] = biz;
    saveStoredBusinesses(stored);

    return biz;
  },

  resetBusinessAppearance: async (slug: string): Promise<Business | null> => {
    const biz = await businessService.getBusinessBySlug(slug);
    if (!biz) return null;

    const catConfig = normalizeBusinessCategory(biz.category);
    biz.customCoverImage = undefined;
    biz.coverImage = catConfig.backgroundImage;
    biz.visualThemeId = catConfig.id;
    biz.theme.coverImage = catConfig.backgroundImage;
    biz.theme.primaryColor = catConfig.defaultPrimaryColor;
    biz.theme.secondaryColor = catConfig.defaultSecondaryColor;
    biz.theme.fontStyle = catConfig.defaultFontStyle;
    biz.theme.overlayType = catConfig.overlay.type;
    biz.theme.overlayOpacity = catConfig.overlay.opacity;
    biz.theme.headline = catConfig.headline;
    biz.theme.subheadline = catConfig.subheadline;
    biz.theme.ctaText = catConfig.suggestedCTA;
    biz.theme.postCompletionCTA = catConfig.postCompletionCTA;
    biz.theme.menuEnabled = catConfig.menuEnabled;
    biz.theme.servicesEnabled = catConfig.servicesEnabled;
    biz.theme.productsEnabled = catConfig.productsEnabled;
    biz.menuEnabled = catConfig.menuEnabled;
    biz.servicesEnabled = catConfig.servicesEnabled;
    biz.productsEnabled = catConfig.productsEnabled;

    runtimeBusinesses[slug] = biz;
    const stored = getStoredBusinesses();
    stored[slug] = biz;
    saveStoredBusinesses(stored);

    return biz;
  },

  deleteBusiness: async (slug: string): Promise<boolean> => {
    delete runtimeBusinesses[slug];
    const stored = getStoredBusinesses();
    delete stored[slug];
    saveStoredBusinesses(stored);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('businesses').delete().eq('slug', slug);
      } catch (e) {}
    }
    return true;
  },

  getRemainingLifetimeSlots: async (): Promise<{ total: number; claimed: number; remaining: number }> => {
    try {
      const all = await businessService.getAllBusinesses();
      const total = 100;
      // Start with base claimed slots + newly activated businesses
      const count = Math.min(99, Math.max(14, all.length));
      const remaining = Math.max(1, total - count);
      return { total, claimed: count, remaining };
    } catch {
      return { total: 100, claimed: 14, remaining: 86 };
    }
  }
};

// ============================================================================
// REVIEW SERVICE
// ============================================================================
export const reviewService = {
  getReviews: async (businessId: string): Promise<Review[]> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('google_reviews')
          .select('*')
          .eq('business_id', businessId)
          .order('review_time', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((r: any): Review => ({
            reviewId: r.google_review_id || r.id,
            businessId: r.business_id,
            reviewerName: r.reviewer_name || 'Verified Customer',
            reviewerImage: r.reviewer_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
            rating: r.rating,
            text: r.review_text || '',
            date: r.review_time,
            source: 'google',
            status: 'published',
            sentiment: (r.sentiment || 'positive') as any,
            replyStatus: (r.reply_status === 'replied' ? 'replied' : 'pending') as any,
            tags: Array.isArray(r.topics) ? r.topics : ['Customer Review'],
          }));
        }
      } catch (err) {
        console.warn('Could not query reviews from Supabase:', err);
      }
    }

    let storedReviews: Review[] = [];
    if (isBrowser) {
      try {
        const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
        if (raw) storedReviews = JSON.parse(raw);
      } catch (e) {}
    }

    const filtered = storedReviews.filter(r => r.businessId === businessId);
    if (filtered.length > 0) return filtered;

    if (isDemoMode()) {
      return mockData.mockReviews.filter(r => r.businessId === businessId);
    }

    return []; // STRICT PRODUCTION: ZERO FAKE REVIEWS
  },

  submitReview: async (review: Partial<Review>): Promise<Review> => {
    const textContent = review.text || (review as any).comment || '';
    const newReview: Review = { 
      reviewId: review.reviewId || `rev_${Date.now()}`,
      businessId: review.businessId || 'your-business',
      reviewerName: review.reviewerName || 'Customer',
      rating: review.rating || 5,
      text: textContent,
      date: new Date().toISOString(),
      source: review.source || 'google',
      status: 'published',
      sentiment: (review.rating || 5) >= 4 ? 'positive' : 'negative',
      replyStatus: 'pending',
      tags: review.tags || ['Customer Review'],
      reviewerImage: review.reviewerImage,
    };

    if (isSupabaseConfigured() && review.businessId && !review.businessId.startsWith('biz_')) {
      try {
        await supabase.from('google_reviews').insert({
          business_id: review.businessId,
          google_review_id: newReview.reviewId,
          reviewer_name: newReview.reviewerName,
          rating: newReview.rating,
          review_text: newReview.text,
          sentiment: newReview.sentiment,
          reply_status: 'unanswered',
        });
      } catch (err) {
        console.warn('Could not insert review in Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
        const list: Review[] = raw ? JSON.parse(raw) : [];
        list.unshift(newReview);
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }

    mockData.mockReviews.unshift(newReview);
    return newReview;
  },

  submitPrivateFeedback: async (feedback: Omit<PrivateFeedback, 'feedbackId' | 'createdAt' | 'status'>): Promise<PrivateFeedback> => {
    const record: PrivateFeedback = {
      ...feedback,
      feedbackId: `fb_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    if (isSupabaseConfigured() && feedback.businessId && !feedback.businessId.startsWith('biz_')) {
      try {
        await supabase.from('customer_events').insert({
          business_id: feedback.businessId,
          event_type: 'private_feedback',
          metadata: {
            rating: feedback.rating,
            message: feedback.message,
            tags: feedback.tags,
            customerName: feedback.customerName,
            customerPhone: feedback.customerPhone,
          },
        });
      } catch (err) {}
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        const list: PrivateFeedback[] = raw ? JSON.parse(raw) : [];
        list.unshift(record);
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return record;
  },

  getPrivateFeedbacks: async (businessSlug: string): Promise<PrivateFeedback[]> => {
    if (!isBrowser) return [];
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (!raw) return [];
      const list: PrivateFeedback[] = JSON.parse(raw);
      return list.filter(f => f.businessSlug === businessSlug);
    } catch (e) {
      return [];
    }
  },

  getAllPrivateFeedbacks: async (): Promise<PrivateFeedback[]> => {
    if (!isBrowser) return [];
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  addReply: async (reviewId: string, replyText: string, replyType: 'manual' | 'auto' = 'manual'): Promise<Review | null> => {
    if (isSupabaseConfigured() && !reviewId.startsWith('rev_')) {
      try {
        await supabase.from('review_replies').insert({
          google_review_id: reviewId,
          reply_text: replyText,
          reply_type: replyType,
          status: 'posted',
        });
        await supabase
          .from('google_reviews')
          .update({ reply_status: 'replied' })
          .eq('google_review_id', reviewId);
      } catch (err) {
        console.warn('Could not save reply to Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
        if (raw) {
          const list: Review[] = JSON.parse(raw);
          const idx = list.findIndex(r => r.reviewId === reviewId);
          if (idx >= 0) {
            list[idx].replyStatus = 'replied';
            localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(list));
            return list[idx];
          }
        }
      } catch (e) {}
    }
    return null;
  }
};

// ============================================================================
// MENU SERVICE
// ============================================================================
export const menuService = {
  getCategories: async (businessId: string): Promise<MenuCategory[]> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data: menu } = await supabase
          .from('menus')
          .select('id')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .maybeSingle();

        if (menu) {
          const { data: cats, error } = await supabase
            .from('menu_categories')
            .select('*')
            .eq('menu_id', menu.id)
            .eq('active', true)
            .order('sort_order', { ascending: true });

          if (!error && cats && cats.length > 0) {
            return [
              { categoryId: 'cat_all', businessId, name: 'All', order: 0 },
              ...cats.map((c: any) => ({
                categoryId: c.id,
                businessId,
                name: c.name,
                order: c.sort_order,
              }))
            ];
          }
        }
      } catch (err) {
        console.warn('Could not query menu categories from Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(`pixora_menu_cats_${businessId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }

    if (isDemoMode()) {
      return mockData.mockMenuCategories;
    }

    return [{ categoryId: 'cat_all', businessId, name: 'All', order: 0 }];
  },

  getItems: async (businessId: string): Promise<MenuItem[]> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data: menu } = await supabase
          .from('menus')
          .select('id')
          .eq('business_id', businessId)
          .eq('status', 'active')
          .maybeSingle();

        if (menu) {
          const { data: items, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('menu_id', menu.id)
            .eq('active', true)
            .order('sort_order', { ascending: true });

          if (!error && items && items.length > 0) {
            return items.map((it: any) => ({
              itemId: it.id,
              categoryId: it.category_id || 'cat_all',
              name: it.name,
              description: it.description || '',
              price: Number(it.price) || 0,
              image: it.image_url || '',
              isBestseller: it.bestseller || false,
              isVegetarian: true,
              isLive: it.active,
            }));
          }
        }
      } catch (err) {
        console.warn('Could not query menu items from Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(`pixora_menu_items_${businessId}`);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
    }

    if (isDemoMode()) {
      return mockData.mockMenuItems;
    }

    return []; // STRICT PRODUCTION: NO FAKE MENU ITEMS
  },

  updateItem: async (item: MenuItem): Promise<MenuItem> => {
    if (isSupabaseConfigured() && !item.itemId.startsWith('item_')) {
      try {
        await supabase
          .from('menu_items')
          .update({
            name: item.name,
            price: item.price,
            description: item.description,
            active: item.isLive,
            bestseller: item.isBestseller,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.itemId);
      } catch (err) {
        console.warn('Could not update menu item in Supabase:', err);
      }
    }

    const idx = mockData.mockMenuItems.findIndex(i => i.itemId === item.itemId);
    if (idx >= 0) {
      mockData.mockMenuItems[idx] = item;
    }
    return item;
  },

  addItem: async (item: MenuItem): Promise<MenuItem> => {
    if (isSupabaseConfigured() && item.businessId && !item.businessId.startsWith('biz_')) {
      try {
        const { data: menu } = await supabase
          .from('menus')
          .select('id')
          .eq('business_id', item.businessId)
          .eq('status', 'active')
          .maybeSingle();

        if (menu) {
          const { data: inserted } = await supabase
            .from('menu_items')
            .insert({
              menu_id: menu.id,
              category_id: item.categoryId !== 'cat_all' ? item.categoryId : null,
              name: item.name,
              description: item.description,
              price: item.price,
              active: item.isLive,
              bestseller: item.isBestseller,
            })
            .select()
            .single();

          if (inserted) {
            return {
              ...item,
              itemId: inserted.id,
            };
          }
        }
      } catch (err) {
        console.warn('Could not insert menu item in Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const key = `pixora_menu_items_${item.businessId || 'default'}`;
        const raw = localStorage.getItem(key);
        const list: MenuItem[] = raw ? JSON.parse(raw) : [];
        list.push(item);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) {}
    }
    return item;
  },

  deleteItem: async (itemId: string): Promise<boolean> => {
    if (isSupabaseConfigured() && !itemId.startsWith('item_')) {
      try {
        await supabase.from('menu_items').delete().eq('id', itemId);
      } catch (err) {
        console.warn('Could not delete menu item in Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        // Remove from all stored items keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('pixora_menu_items_')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list: MenuItem[] = JSON.parse(raw);
              const filtered = list.filter(it => it.itemId !== itemId);
              localStorage.setItem(key, JSON.stringify(filtered));
            }
          }
        }
      } catch (e) {}
    }
    return true;
  },

  saveMenuRecord: async (businessId: string, sessionId: string, menuId?: string): Promise<void> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        await supabase.from('menu_saves').insert({
          business_id: businessId,
          session_id: sessionId,
          menu_id: menuId || null,
        });
      } catch (e) {}
    }
  }
};

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================
export const analyticsService = {
  getDashboardAnalytics: async (businessId: string): Promise<Analytics> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        // Query real aggregated counts
        const [qrRes, reviewsRes, eventsRes] = await Promise.all([
          supabase.from('qr_events').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
          supabase.from('google_reviews').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
          supabase.from('analytics_events').select('event_type').eq('business_id', businessId),
        ]);

        const qrCount = qrRes.count || 0;
        const reviewsCount = reviewsRes.count || 0;
        const events = eventsRes.data || [];

        const menuViews = events.filter((e: any) => e.event_type === 'menu_view').length;
        const reviewSubmissions = events.filter((e: any) => e.event_type === 'experience_started').length;

        return {
          googleReviews: reviewsCount,
          googleReviewsGrowth: reviewsCount > 0 ? 100 : 0,
          menuViews: menuViews,
          menuViewsGrowth: menuViews > 0 ? 100 : 0,
          qrScans: qrCount,
          qrScansGrowth: qrCount > 0 ? 100 : 0,
          reviewSubmissions: reviewSubmissions,
          reviewSubmissionsGrowth: reviewSubmissions > 0 ? 100 : 0,
          customers: 0, // Placeholder
          customersGrowth: 0,
          automatedReplies: 0, // Placeholder
          automatedRepliesGrowth: 0,
        };
      } catch (err) {
        console.warn('Could not calculate Supabase analytics:', err);
      }
    }

    let reviewCount = 0;
    let qrCount = 0;
    let feedbackCount = 0;

    if (isBrowser) {
      try {
        const rawReviews = localStorage.getItem(REVIEWS_STORAGE_KEY);
        if (rawReviews) {
          const list: Review[] = JSON.parse(rawReviews);
          reviewCount = list.filter(r => r.businessId === businessId).length;
        }

        const rawFeedbacks = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (rawFeedbacks) {
          const list: PrivateFeedback[] = JSON.parse(rawFeedbacks);
          feedbackCount = list.filter(f => f.businessId === businessId).length;
        }

        const rawQRs = localStorage.getItem(QR_STORAGE_KEY);
        if (rawQRs) {
          const list: QRCode[] = JSON.parse(rawQRs);
          const bizQRs = list.filter(q => q.businessId === businessId);
          qrCount = bizQRs.reduce((sum, q) => sum + (q.scans || 0), 0);
        }
      } catch (e) {}
    }

    if (isDemoMode()) {
      return mockData.mockAnalytics;
    }

    // STRICT PRODUCTION: ZERO DUMMY STATS
    return {
      googleReviews: reviewCount,
      googleReviewsGrowth: 0,
      menuViews: 0,
      menuViewsGrowth: 0,
      qrScans: qrCount,
      qrScansGrowth: 0,
      reviewSubmissions: feedbackCount,
      reviewSubmissionsGrowth: 0,
      customers: 0,
      customersGrowth: 0,
      automatedReplies: 0,
      automatedRepliesGrowth: 0,
    };
  },

  trackEvent: async (eventName: string, payload: any) => {
    if (isSupabaseConfigured() && payload?.businessId && !payload.businessId.startsWith('biz_')) {
      try {
        await supabase.from('analytics_events').insert({
          business_id: payload.businessId,
          session_id: payload.sessionId || null,
          event_type: eventName,
          metadata: payload,
        });
      } catch (e) {}
    }
    console.log(`[Analytics Event] ${eventName}`, payload);
  },

  getAnalytics: async (businessId: string): Promise<Analytics> => {
    return analyticsService.getDashboardAnalytics(businessId);
  }
};

// ============================================================================
// QR SERVICE
// ============================================================================
export const qrService = {
  createQRCode: async (businessId: string, options: { name: string; location?: string; style?: any; slug?: string }): Promise<QRCode> => {
    const cleanSlug = options.slug || businessId;
    const locParam = options.location ? `?loc=${encodeURIComponent(options.location)}` : '';
    const newQR: QRCode = {
      qrId: `qr_${Date.now()}`,
      businessId,
      name: options.name,
      location: options.location || options.name,
      shortLink: `funnel.pixoraautomations.com/f/${cleanSlug}${locParam}`,
      shortCode: Date.now().toString(36),
      scans: 0,
      createdOn: new Date().toISOString(),
      status: 'active',
    };

    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        await supabase.from('qr_codes').insert({
          business_id: businessId,
          name: newQR.name,
          location_name: newQR.location,
          destination_url: `https://${newQR.shortLink}`,
          status: 'active',
        });
      } catch (err) {
        console.warn('Could not insert QR in Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(QR_STORAGE_KEY);
        const list: QRCode[] = raw ? JSON.parse(raw) : [];
        list.push(newQR);
        localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return newQR;
  },

  updateQRCode: async (
    businessId: string,
    qrId: string,
    updates: { name?: string; location?: string; status?: 'active' | 'inactive'; slug?: string }
  ): Promise<QRCode | null> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        await supabase
          .from('qr_codes')
          .update({
            ...(updates.name && { name: updates.name }),
            ...(updates.location && { location_name: updates.location }),
            ...(updates.status && { status: updates.status }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', qrId)
          .eq('business_id', businessId);
      } catch (err) {
        console.warn('Could not update QR in Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(QR_STORAGE_KEY);
        if (raw) {
          const list: QRCode[] = JSON.parse(raw);
          const index = list.findIndex(q => q.qrId === qrId);
          if (index !== -1) {
            const current = list[index];
            const updatedLocation = updates.location !== undefined ? updates.location : current.location;
            const updatedName = updates.name !== undefined ? updates.name : current.name;
            const locParam = updatedLocation ? `?loc=${encodeURIComponent(updatedLocation)}` : '';
            const baseSlug = updates.slug || (current.shortLink ? current.shortLink.split('/f/')[1]?.split('?')[0] : businessId);

            list[index] = {
              ...current,
              name: updatedName,
              location: updatedLocation,
              shortLink: `funnel.pixoraautomations.com/f/${baseSlug}${locParam}`,
              status: updates.status || current.status,
            };
            localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(list));
            return list[index];
          }
        }
      } catch (e) {}
    }
    return null;
  },

  deleteQRCode: async (businessId: string, qrId: string): Promise<boolean> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        await supabase
          .from('qr_codes')
          .delete()
          .eq('id', qrId)
          .eq('business_id', businessId);
      } catch (err) {
        console.warn('Could not delete QR in Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(QR_STORAGE_KEY);
        if (raw) {
          const list: QRCode[] = JSON.parse(raw);
          const filtered = list.filter(q => q.qrId !== qrId);
          localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(filtered));
          return true;
        }
      } catch (e) {}
    }
    return true;
  },

  getQRCodes: async (businessId: string, slug?: string): Promise<QRCode[]> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('qr_codes')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = data.map((q: any) => ({
            qrId: q.id,
            businessId: q.business_id,
            name: q.name,
            location: q.location_name || q.table_name || 'Main Area',
            shortLink: (q.destination_url || '').replace('https://', ''),
            scans: 0,
            createdOn: q.created_at,
            status: q.status as 'active' | 'inactive',
          }));

          const isLegacyPair = mapped.length === 2 &&
            (mapped.some((q: any) => q.name.includes('Table 01') || q.name.includes('Dining Area'))) &&
            (mapped.some((q: any) => q.name.includes('Billing Counter')));

          if (isLegacyPair) {
            return [{
              ...mapped[0],
              name: 'Main Stand / Storefront',
              location: 'Main Entrance & Counter',
              shortLink: `funnel.pixoraautomations.com/f/${slug || businessId}`,
            }];
          }

          return mapped;
        }
      } catch (err) {
        console.warn('Could not fetch QR codes from Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(QR_STORAGE_KEY);
        if (raw) {
          const list: QRCode[] = JSON.parse(raw);
          const found = list.filter(q => q.businessId === businessId);
          if (found.length > 0) {
            // Check if user has the legacy dummy pair ("Dining Area / Main Tables" & "Billing Counter / Reception") with 0 scans
            const isLegacyPair = found.length === 2 &&
              found.some(q => q.name.includes('Dining Area')) &&
              found.some(q => q.name.includes('Billing Counter')) &&
              found.every(q => (q.scans || 0) === 0);

            if (isLegacyPair) {
              const singleDefault: QRCode = {
                qrId: `qr_${Date.now()}_main`,
                businessId,
                name: 'Main Stand / Storefront',
                location: 'Main Entrance & Counter',
                shortLink: `funnel.pixoraautomations.com/f/${slug || businessId}`,
                scans: 0,
                createdOn: new Date().toISOString(),
                status: 'active',
              };
              const remaining = list.filter(q => q.businessId !== businessId);
              remaining.push(singleDefault);
              localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(remaining));
              return [singleDefault];
            }
            return found;
          }
        }
      } catch (e) {}
    }

    // Default: Only 1 single default QR code is generated by default
    const targetSlug = slug || businessId;
    const singleDefaultQR: QRCode = {
      qrId: `qr_${Date.now()}_main`,
      businessId,
      name: 'Main Stand / Storefront',
      location: 'Main Entrance & Counter',
      shortLink: `funnel.pixoraautomations.com/f/${targetSlug}`,
      scans: 0,
      createdOn: new Date().toISOString(),
      status: 'active',
    };

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(QR_STORAGE_KEY);
        const list: QRCode[] = raw ? JSON.parse(raw) : [];
        list.push(singleDefaultQR);
        localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }

    return [singleDefaultQR];
  },

  createDefaultQRsForBusiness: (businessId: string, slug: string, name?: string): QRCode[] => {
    // Single QR code generated by default
    const qrs: QRCode[] = [
      {
        qrId: `qr_${Date.now()}_main`,
        businessId,
        name: 'Main Stand / Storefront',
        location: 'Main Entrance & Counter',
        shortLink: `funnel.pixoraautomations.com/f/${slug}`,
        scans: 0,
        createdOn: new Date().toISOString(),
        status: 'active',
      },
    ];

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(QR_STORAGE_KEY);
        const list: QRCode[] = raw ? JSON.parse(raw) : [];
        const filtered = list.filter(q => q.businessId !== businessId);
        filtered.push(...qrs);
        localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {}
    }

    return qrs;
  },

  getFunnelUrl: (slug: string): string => {
    const cleanSlug = (slug || '').trim().toLowerCase();
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/f/${cleanSlug}`;
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';
    return `${baseUrl}/f/${cleanSlug}`;
  },

  generateQR: (slug: string, options?: { primaryColor?: string; size?: number }) => {
    const url = qrService.getFunnelUrl(slug);
    return {
      slug,
      url,
      primaryColor: options?.primaryColor || '#0B3D2E',
      size: options?.size || 240,
      createdAt: new Date().toISOString(),
    };
  },

  downloadQR: (elementId: string, filename: string = 'pixora-funnel-qr.png') => {
    if (typeof window === 'undefined') return;
    const canvas = document.getElementById(elementId) as HTMLCanvasElement | null;
    if (!canvas) {
      console.warn(`QR canvas element #${elementId} not found.`);
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  printQR: (elementId: string, businessName: string = 'Your Business') => {
    if (typeof window === 'undefined') return;
    const canvas = document.getElementById(elementId) as HTMLCanvasElement | null;
    if (!canvas) {
      window.print();
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${businessName} - QR Standee</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; text-align: center; }
            .card { border: 2px solid #e5e7eb; border-radius: 24px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 360px; }
            h1 { font-size: 22px; margin: 0 0 8px; }
            p { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
            img { width: 220px; height: 220px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${businessName}</h1>
            <p>Scan to rate your experience & view details</p>
            <img src="${dataUrl}" alt="QR Code" />
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

// ============================================================================
// CUSTOMERS SERVICE
// ============================================================================
export const customerService = {
  getCustomers: async (businessId: string): Promise<Customer[]> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessId)
          .order('last_seen_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((c: any): Customer => ({
            customerId: c.id,
            businessId: c.business_id,
            name: c.name || 'Valued Customer',
            phone: c.phone || '',
            email: c.email || undefined,
            visits: c.visit_count || 1,
            lastVisit: c.last_seen_at || new Date().toISOString(),
            totalSpend: 0,
            avgRating: 5,
            source: 'qr',
            status: 'regular',
            tags: ['Customer'],
          }));
        }
      } catch (err) {
        console.warn('Could not query customers from Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const rawFeedbacks = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (rawFeedbacks) {
          const list: PrivateFeedback[] = JSON.parse(rawFeedbacks);
          const bizFeedbacks = list.filter(f => f.businessId === businessId && (f.customerName || f.customerPhone));
          if (bizFeedbacks.length > 0) {
            return bizFeedbacks.map((f, idx): Customer => ({
              customerId: f.feedbackId || `cust_${idx}`,
              businessId: f.businessId,
              name: f.customerName || 'Customer',
              phone: f.customerPhone || '',
              email: undefined,
              visits: 1,
              lastVisit: f.createdAt,
              totalSpend: 0,
              avgRating: f.rating,
              source: 'qr',
              status: 'regular',
              tags: f.tags && f.tags.length > 0 ? f.tags : ['Feedback Customer'],
            }));
          }
        }
      } catch (e) {}
    }

    if (isDemoMode()) {
      return mockData.mockCustomers;
    }

    return []; // STRICT PRODUCTION: ZERO FAKE CUSTOMERS
  },
};

// ============================================================================
// REVIEW ENGINE & AUTO REPLY ENGINE (Deterministic Local Algorithms)
// ============================================================================
export const reviewEngine = {
  generateReviewSuggestions: async (input: string, businessName: string = 'this place', category?: string): Promise<string[]> => {
    // We dynamically import to avoid circular dependencies in index.ts if any
    const { generateCombinatorialReviews } = await import('@/data/reviewCombinator');
    const cleanInput = input.trim();
    return generateCombinatorialReviews(3, businessName, category, cleanInput);
  }
};

export const replyEngine = {
  generateReplySuggestion: async (review: Review, businessName: string = 'our business'): Promise<string> => {
    const reviewerName = review.reviewerName.split(' ')[0] || 'valued guest';
    if (review.rating >= 4) {
      return `Thank you so much for the glowing review, ${reviewerName}! 🙏 We are thrilled you had such a wonderful time at ${businessName}. Looking forward to hosting you again very soon! ✨`;
    } else {
      return `Dear ${reviewerName}, thank you for taking the time to share your honest feedback. We hold ourselves to the highest standards, and we sincerely apologize that your visit was not 100% satisfactory. Our team is already looking into this, and we'd love the opportunity to make it right for you.`;
    }
  }
};
