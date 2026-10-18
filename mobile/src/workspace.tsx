import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from '@/ctx';
import { getPublicFunnelUrl } from '@/lib/config';
import { MobileApiError, getMobileBusinesses, syncGoogleReviews, type GoogleSyncResponse } from '@/lib/mobileApi';
import { supabase } from '@/lib/supabase';
import type {
  MobileActivity,
  MobileBusiness,
  MobileNfcOrder,
  MobileReview,
  WorkspaceSnapshot,
} from '@/lib/types';

type WorkspaceStatus = 'loading' | 'ready' | 'empty' | 'error';

interface WorkspaceContextValue {
  workspace: WorkspaceSnapshot | null;
  status: WorkspaceStatus;
  isRefreshing: boolean;
  error: string | null;
  refresh: (silent?: boolean) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  updateBusiness: (updates: Record<string, unknown>) => Promise<void>;
  updateProfile: (updates: { full_name?: string; phone?: string }) => Promise<void>;
  syncReviews: () => Promise<GoogleSyncResponse>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return value;
}

function normalizeBusiness(row: Record<string, unknown>): MobileBusiness {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    slug: String(row.slug || ''),
    category: (row.category as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    tagline: (row.tagline as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    pincode: (row.pincode as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    logo_url: (row.logo_url as string | null) ?? null,
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    primary_color: (row.primary_color as string | null) ?? null,
    secondary_color: (row.secondary_color as string | null) ?? null,
    accent_color: (row.accent_color as string | null) ?? null,
    status: String(row.status || 'unknown'),
    owner_id: (row.owner_id as string | null) ?? null,
    plan_status: (row.plan_status as string | null) ?? null,
    trial_expires_at: (row.trial_expires_at as string | null) ?? null,
    google_place_id: (row.google_place_id as string | null) ?? null,
    google_review_url: (row.google_review_url as string | null) ?? null,
    google_maps_url: (row.google_maps_url as string | null) ?? null,
    membershipRole: (row.membershipRole as string | null) ?? null,
    funnel: (row.funnel as MobileBusiness['funnel']) ?? null,
    qrCode: (row.qrCode as MobileBusiness['qrCode']) ?? null,
    googleConnection: (row.googleConnection as MobileBusiness['googleConnection']) ?? null,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'We could not load this business right now.';
}

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const { session, user } = useSession();
  const accessToken = session?.access_token ?? null;
  const userId = user?.id ?? null;
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [status, setStatus] = useState<WorkspaceStatus>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (silent = false) => {
    if (!accessToken) {
      setWorkspace(null);
      setStatus('loading');
      return;
    }

    if (silent) setIsRefreshing(true);
    else setStatus('loading');
    setError(null);

    try {
      const response = await getMobileBusinesses(accessToken);
      const rawBusiness = response.businesses[0];

      if (!rawBusiness) {
        setWorkspace(null);
        setStatus('empty');
        return;
      }

      const business = normalizeBusiness(rawBusiness);
      const db = supabase as any;
      const [reviewsResult, activityResult, qrEventsResult, repliedResult, nfcResult, connectionResult] = await Promise.all([
        db.from('google_reviews').select('*').eq('business_id', business.id).order('review_time', { ascending: false }).limit(50),
        db.from('analytics_events').select('id,event_type,created_at,metadata').eq('business_id', business.id).order('created_at', { ascending: false }).limit(20),
        db.from('qr_events').select('id,event_type,created_at', { count: 'exact' }).eq('business_id', business.id),
        db.from('google_reviews').select('id', { count: 'exact', head: true }).eq('business_id', business.id).eq('reply_status', 'replied'),
        db.from('nfc_orders').select('*').eq('business_id', business.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        db.from('google_connections').select('id,business_id,provider,google_account_id,google_location_id,status,scopes,connected_at,last_synced_at,initial_sync_completed_at,next_sync_at,sync_error').eq('business_id', business.id).maybeSingle(),
      ]);

      const reviews = (reviewsResult.data || []) as MobileReview[];
      const analytics = (activityResult.data || []) as MobileActivity[];
      const qrActivities: MobileActivity[] = (qrEventsResult.data || []).map((event: { id: string; event_type: string; created_at: string }) => ({
        id: event.id,
        event_type: event.event_type,
        created_at: event.created_at,
        metadata: null,
      }));
      const activities = [...analytics, ...qrActivities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);

      const connection = connectionResult.data || business.googleConnection;
      const hydratedBusiness: MobileBusiness = {
        ...business,
        googleConnection: connection || null,
      };

      setWorkspace({
        business: hydratedBusiness,
        funnelUrl: business.qrCode?.destination_url || getPublicFunnelUrl(business.funnel?.slug || business.slug),
        reviews,
        activities,
        nfcOrder: (nfcResult.data || null) as MobileNfcOrder | null,
        stats: {
          reviewCount: reviewsResult.error ? 0 : (reviewsResult.count ?? reviews.length),
          scanCount: qrEventsResult.error ? 0 : (qrEventsResult.count ?? 0),
          repliedCount: repliedResult.error ? reviews.filter((review) => review.reply_status === 'replied').length : (repliedResult.count ?? 0),
        },
        hasMoreReviews: !reviewsResult.error && reviews.length === 50,
        reviewsError: reviewsResult.error?.message || null,
        dataSource: 'live',
      });
      setStatus('ready');
    } catch (loadError) {
      setError(errorMessage(loadError));
      setStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => {
    // Loading remote tenant data is the purpose of this effect; its callback
    // updates the workspace state after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadWorkspace();
  }, [loadWorkspace]);

  const loadMoreReviews = useCallback(async () => {
    if (!accessToken || !workspace?.business.id || !workspace.hasMoreReviews) return;
    const oldest = workspace.reviews[workspace.reviews.length - 1]?.review_time;
    if (!oldest) return;
    const db = supabase as any;
    const { data, error: queryError } = await db
      .from('google_reviews')
      .select('*')
      .eq('business_id', workspace.business.id)
      .lt('review_time', oldest)
      .order('review_time', { ascending: false })
      .limit(50);
    if (queryError) throw new Error(queryError.message);
    const nextReviews = (data || []) as MobileReview[];
    setWorkspace((current) => current ? {
      ...current,
      reviews: [...current.reviews, ...nextReviews],
      hasMoreReviews: nextReviews.length === 50,
    } : current);
  }, [accessToken, workspace]);

  const updateBusiness = useCallback(async (updates: Record<string, unknown>) => {
    if (!workspace?.business.id) throw new Error('No business is selected.');
    const db = supabase as any;
    const { data, error: updateError } = await db
      .from('businesses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', workspace.business.id)
      .select('*')
      .single();
    if (updateError) throw new Error(updateError.message);
    const nextBusiness = normalizeBusiness({
      ...workspace.business,
      ...(data || updates),
      funnel: workspace.business.funnel,
      qrCode: workspace.business.qrCode,
      googleConnection: workspace.business.googleConnection,
    });
    setWorkspace((current) => current ? { ...current, business: nextBusiness } : current);
  }, [workspace]);

  const updateProfile = useCallback(async (updates: { full_name?: string; phone?: string }) => {
    if (!userId) throw new Error('No signed-in user is available.');
    const db = supabase as any;
    const { error: updateError } = await db
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .or(`auth_user_id.eq.${userId},id.eq.${userId}`);
    if (updateError) throw new Error(updateError.message);
  }, [userId]);

  const syncReviews = useCallback(async () => {
    const businessId = workspace?.business.id ?? null;
    if (!accessToken || !businessId) {
      return { success: false, status: 'requires_auth', message: 'Sign in before syncing reviews.' };
    }
    const result = await syncGoogleReviews(accessToken, businessId);
    if (result.success || result.status === 'access_pending') await loadWorkspace(true);
    return result;
  }, [accessToken, loadWorkspace, workspace]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    workspace,
    status,
    isRefreshing,
    error,
    refresh: loadWorkspace,
    loadMoreReviews,
    updateBusiness,
    updateProfile,
    syncReviews,
  }), [error, isRefreshing, loadMoreReviews, loadWorkspace, status, syncReviews, updateBusiness, updateProfile, workspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
