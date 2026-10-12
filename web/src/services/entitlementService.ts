'use server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function getAccountAccess(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return profile;
}

export async function getBusinessEntitlements(businessId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: subData } = await (supabase as any)
    .from('subscriptions')
    .select('status, expires_at, is_lifetime, plan_id')
    .eq('business_id', businessId)
    .single();
  
  const sub = subData as any;

  // If no subscription record, they have nothing
  if (!sub) return { access: false, reason: 'No subscription found' };

  if (sub.is_lifetime) return { access: true, status: 'lifetime' };
  
  if (sub.status === 'trial') {
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
       return { access: false, status: 'expired', reason: 'Trial expired' };
    }
    return { access: true, status: 'trial' };
  }

  if (sub.status === 'active') return { access: true, status: 'active' };

  return { access: false, status: sub.status };
}
