import { Funnel } from '@/types';
import { businessService } from './index';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const isBrowser = typeof window !== 'undefined';
const FUNNEL_STORAGE_KEY = 'pixora_funnels';

function getDynamicFunnelUrl(slug: string): string {
  const cleanSlug = (slug || '').trim().toLowerCase();
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/f/${cleanSlug}`;
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';
  return `${baseUrl}/f/${cleanSlug}`;
}

export const funnelService = {
  createFunnel: async (businessId: string, slug: string): Promise<Funnel> => {
    let funnelId = `fnl_${Date.now()}`;

    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('funnels')
          .insert({
            business_id: businessId,
            slug,
            status: 'active',
            review_enabled: true,
            smart_review_enabled: true,
            menu_enabled: true,
          })
          .select('id')
          .single();

        if (!error && data) {
          funnelId = data.id;
        }
      } catch (err) {
        console.warn('Could not persist funnel in Supabase:', err);
      }
    }

    const funnel: Funnel = {
      id: funnelId,
      businessId,
      slug,
      qrUrl: getDynamicFunnelUrl(slug),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(FUNNEL_STORAGE_KEY);
        const list: Funnel[] = raw ? JSON.parse(raw) : [];
        list.push(funnel);
        localStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
    return funnel;
  },

  getFunnel: async (businessId: string): Promise<Funnel | null> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('funnels')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            businessId: data.business_id,
            slug: data.slug,
            qrUrl: getDynamicFunnelUrl(data.slug),
            status: (data.status === 'active' ? 'active' : 'draft') as 'active' | 'draft' | 'paused',
            createdAt: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Could not query funnel from Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(FUNNEL_STORAGE_KEY);
        if (raw) {
          const list: Funnel[] = JSON.parse(raw);
          const found = list.find(f => f.businessId === businessId);
          if (found) {
            return {
              ...found,
              qrUrl: getDynamicFunnelUrl(found.slug),
            };
          }
        }
      } catch (e) {}
    }
    const biz = await businessService.getBusinessById(businessId);
    if (biz) {
      return {
        id: `fnl_${biz.businessId}`,
        businessId: biz.businessId,
        slug: biz.slug,
        qrUrl: getDynamicFunnelUrl(biz.slug),
        status: 'active',
        createdAt: biz.createdAt,
      };
    }
    return null;
  },

  getPublicFunnel: async (slug: string): Promise<Funnel | null> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('funnels')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            businessId: data.business_id,
            slug: data.slug,
            qrUrl: getDynamicFunnelUrl(data.slug),
            status: (data.status === 'active' ? 'active' : 'draft') as 'active' | 'draft' | 'paused',
            createdAt: data.created_at,
          };
        }
      } catch (err) {}
    }

    const biz = await businessService.getBusinessBySlug(slug);
    if (!biz) return null;
    return {
      id: `fnl_${biz.businessId}`,
      businessId: biz.businessId,
      slug: biz.slug,
      qrUrl: getDynamicFunnelUrl(biz.slug),
      status: 'active',
      createdAt: biz.createdAt,
    };
  }
};
