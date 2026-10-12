import { Trial } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { statsService } from './statsService';

const isBrowser = typeof window !== 'undefined';
const TRIAL_STORAGE_KEY = 'pixora_active_trial';

export const trialService = {
  startTrial: async (userId: string, businessId?: string): Promise<Trial> => {
    // Increment live platform demos count
    statsService.recordTrialStarted();

    const startedAt = new Date().toISOString();
    // 1-Day Trial (24 hours from start)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    let trialId = `trial_${Date.now()}`;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('trials')
          .insert({
            user_id: userId.startsWith('usr_') ? null : userId,
            business_id: businessId && !businessId.startsWith('biz_') ? businessId : null,
            started_at: startedAt,
            expires_at: expiresAt,
            status: 'active',
          })
          .select('id')
          .single();

        if (!error && data) {
          trialId = data.id;
        }
      } catch (err) {
        console.warn('Could not persist trial to Supabase:', err);
      }
    }

    const trial: Trial = {
      id: trialId,
      userId,
      businessId,
      startedAt,
      expiresAt,
      status: 'active',
    };

    if (isBrowser) {
      localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trial));
    }
    return trial;
  },

  getTrialStatus: async (businessId?: string): Promise<Trial> => {
    if (isSupabaseConfigured() && businessId && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('trials')
          .select('*')
          .eq('business_id', businessId)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const isExpired = new Date(data.expires_at).getTime() <= Date.now();
          const status = isExpired ? 'expired' : data.status;
          return {
            id: data.id,
            userId: data.user_id || 'usr_unknown',
            businessId: data.business_id || undefined,
            startedAt: data.started_at,
            expiresAt: data.expires_at,
            status: status as 'active' | 'expired' | 'cancelled',
          };
        }
      } catch (err) {
        console.warn('Could not query trial from Supabase:', err);
      }
    }

    if (isBrowser) {
      try {
        const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
        if (raw) {
          const t: Trial = JSON.parse(raw);
          // Check expiration
          if (new Date(t.expiresAt).getTime() <= Date.now()) {
            t.status = 'expired';
          }
          return t;
        }
      } catch (e) {}
    }

    // Default mock 1-day trial with ~18h remaining
    const defaultTrial: Trial = {
      id: 'trial_default',
      userId: 'usr_demo',
      businessId: businessId || 'your-business',
      startedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
      status: 'active',
    };
    return defaultTrial;
  },

  isTrialActive: async (businessId?: string): Promise<boolean> => {
    const trial = await trialService.getTrialStatus(businessId);
    return trial.status === 'active';
  },

  getRemainingTime: (expiresAt?: string): { hours: number; minutes: number; text: string; isExpired: boolean } => {
    if (!expiresAt) {
      return { hours: 24, minutes: 0, text: '24h 00m remaining', isExpired: false };
    }
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) {
      return { hours: 0, minutes: 0, text: 'Trial expired', isExpired: true };
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      hours,
      minutes,
      text: `${hours}h ${minutes.toString().padStart(2, '0')}m remaining`,
      isExpired: false
    };
  }
};
