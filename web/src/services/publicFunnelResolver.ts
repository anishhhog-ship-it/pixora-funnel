import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { Business } from '@/types';
import {
  isBusinessAccessExpired,
  isPaidBusiness,
  resolveBusinessPlanStatus,
} from './businessAccess';
import type { BusinessEntitlementRow } from './businessAccess';

export type PublicFunnelDemo = {
  id: string;
  slug: string;
  business_id?: string | null;
  business_name: string;
  category: string;
  review_destination_url: string;
  primary_color?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  template_slug?: string | null;
  config?: Record<string, unknown> | null;
  status: string;
  expires_at?: string | null;
  view_count?: number;
  created_at?: string;
};

export type PublicFunnelResolution = {
  business: Business | null;
  demo: PublicFunnelDemo | null;
  isLocked: boolean;
  lockReason?: 'demo_expired' | 'trial_expired' | 'revoked' | 'invalid_demo';
};

function mapBusinessRow(
  business: Record<string, unknown> | null,
  demo: PublicFunnelDemo | null,
): Business {
  const demoConfig = (demo?.config || {}) as Record<string, unknown>;
  const source = business || {};
  const entitlement: BusinessEntitlementRow = business || {
    status: 'trial',
    plan_status: 'trial',
    trial_expires_at: demo?.expires_at || null,
  };
  const text = (row: Record<string, unknown>, key: string): string | undefined => {
    const value = row[key];
    return typeof value === 'string' ? value : undefined;
  };
  const boolean = (row: Record<string, unknown>, key: string): boolean | undefined => {
    const value = row[key];
    return typeof value === 'boolean' ? value : undefined;
  };
  const businessId = text(source, 'id') || demo?.business_id || demo?.id || demo?.slug || '';
  const name = text(source, 'name') || demo?.business_name || 'Local Business';
  const category = text(source, 'category') || demo?.category || 'Local Business';
  const primaryColor = text(source, 'primary_color') || demo?.primary_color || '#1A73E8';
  const logo = text(source, 'logo_url') || text(source, 'custom_cover_image') || demo?.logo_url || '';
  const coverImage = text(source, 'custom_cover_image') || text(source, 'cover_image_url') || demo?.cover_url || '';
  const menuEnabled = boolean(source, 'menu_enabled') ?? true;

  return {
    id: businessId,
    businessId,
    ownerId: text(source, 'owner_id'),
    slug: text(source, 'slug') || demo?.slug || '',
    name,
    category,
    city: text(source, 'city') || text(demoConfig, 'city') || '',
    address: text(source, 'address') || text(demoConfig, 'address') || '',
    website: text(source, 'website') || demo?.review_destination_url || '',
    description: text(source, 'description') || '',
    logo,
    coverImage,
    customCoverImage: text(source, 'custom_cover_image') || demo?.cover_url || '',
    googlePlaceId: text(source, 'google_place_id') || '',
    googleReviewUrl: text(source, 'google_review_url') || demo?.review_destination_url || undefined,
    googleMapsUrl: text(source, 'google_maps_url') || undefined,
    ownerName: text(demoConfig, 'owner_name') || 'Business Owner',
    phone: text(source, 'phone') || text(demoConfig, 'phone') || '',
    email: text(source, 'email') || text(demoConfig, 'email') || '',
    menuEnabled,
    planStatus: resolveBusinessPlanStatus(entitlement),
    trialExpiresAt: text(source, 'trial_expires_at') || (!business ? demo?.expires_at || undefined : undefined),
    qrScans: 0,
    reviewsCount: 0,
    createdAt: text(source, 'created_at') || demo?.created_at || new Date().toISOString(),
    theme: {
      primaryColor,
      secondaryColor: text(source, 'secondary_color') || '#D4AF37',
      accentColor: text(source, 'accent_color') || '#FDFBF7',
      logo,
      coverImage,
      businessName: name,
      category,
      tagline: text(source, 'tagline') || text(demoConfig, 'headline') || text(demoConfig, 'tagline') || '',
      subheadline: text(source, 'subheadline') || text(demoConfig, 'subheadline') || undefined,
      menuEnabled,
      topics: demoConfig.topics,
    } as Business['theme'] & { topics?: unknown },
  };
}

export async function getPublicFunnelResolution(slug: string): Promise<PublicFunnelResolution> {
  const cleanSlug = (slug || '').trim().toLowerCase();
  if (!cleanSlug) return { business: null, demo: null, isLocked: false };

  try {
    // sales_demos is added by the sales migration and is not in the generated
    // application Database type yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseAdminClient() as any;
    const { data: demo, error: demoError } = await db
      .from('sales_demos')
      .select('id,slug,business_id,business_name,category,review_destination_url,primary_color,logo_url,cover_url,template_slug,config,status,expires_at,view_count,created_at')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (demoError) throw demoError;

    let business: Record<string, unknown> | null = null;
    if (demo?.business_id) {
      const businessResult = await db
        .from('businesses')
        .select('*')
        .eq('id', demo.business_id)
        .maybeSingle();
      if (businessResult.error) throw businessResult.error;
      business = (businessResult.data || null) as Record<string, unknown> | null;
      // A demo with a broken business foreign key is not a public tenant. Do
      // not fall back to a different business that happens to share its slug.
      if (!business) {
        return {
          business: null,
          demo: (demo || null) as PublicFunnelDemo | null,
          isLocked: true,
          lockReason: 'invalid_demo',
        };
      }
    } else {
      const businessResult = await db
        .from('businesses')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();
      if (businessResult.error) throw businessResult.error;
      business = (businessResult.data || null) as Record<string, unknown> | null;
    }

    if (!business && !demo) {
      return { business: null, demo: null, isLocked: false };
    }
    if (demo && !business) {
      return { business: null, demo: demo as PublicFunnelDemo, isLocked: true, lockReason: 'invalid_demo' };
    }

    const typedDemo = (demo || null) as PublicFunnelDemo | null;
    if (typedDemo && (
      !['active', 'shared', 'converted', 'revoked'].includes(typedDemo.status) ||
      typedDemo.slug !== cleanSlug ||
      !typedDemo.business_name?.trim() ||
      !typedDemo.review_destination_url?.trim()
    )) {
      return { business: null, demo: typedDemo, isLocked: true, lockReason: 'invalid_demo' };
    }
    if (typedDemo && business) {
      const businessSlug = typeof business.slug === 'string' ? business.slug.trim().toLowerCase() : '';
      if (businessSlug && businessSlug !== cleanSlug) {
        return { business: null, demo: typedDemo, isLocked: true, lockReason: 'invalid_demo' };
      }
    }
    const entitlement = business || {
      status: 'trial',
      plan_status: 'trial',
      trial_expires_at: typedDemo?.expires_at || null,
    };
    const mappedBusiness = mapBusinessRow(business, typedDemo);
    const isPaid = isPaidBusiness(entitlement);
    const demoExpiryMs = typedDemo?.expires_at ? new Date(typedDemo.expires_at).getTime() : Number.NaN;
    // Every newly-created unpaid demo has a server-issued expiry. Missing or
    // malformed expiry data is therefore invalid and must not grant preview
    // access. Paid entitlements bypass this demo clock below.
    const isDemoExpired = Boolean(
      typedDemo && (!Number.isFinite(demoExpiryMs) || demoExpiryMs <= Date.now()),
    );
    const isTrialExpired = !isPaid && isBusinessAccessExpired(
      entitlement,
      null,
    );
    const isRevoked = typedDemo?.status === 'revoked';
    const isLocked = isRevoked || (!isPaid && (isDemoExpired || isTrialExpired));

    return {
      business: mappedBusiness,
      demo: typedDemo,
      isLocked,
      lockReason: isRevoked
        ? 'revoked'
        : !isPaid && isDemoExpired
          ? 'demo_expired'
          : !isPaid && isTrialExpired
            ? 'trial_expired'
            : undefined,
    };
  } catch (error) {
    console.error('Public funnel resolution failed:', error);
    // Fail closed. A resolver/database failure must never turn an expired or
    // unknown tenant into an apparently live public funnel.
    return { business: null, demo: null, isLocked: false };
  }
}
