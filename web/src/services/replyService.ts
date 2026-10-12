import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface ReplyRecord {
  id: string;
  businessId: string;
  googleReviewId: string;
  replyText: string;
  source: 'manual' | 'smart' | 'auto';
  status: 'draft' | 'approved' | 'posted' | 'failed';
  createdAt: string;
}

export interface ReplyTemplate {
  id: string;
  businessId: string | null;
  category: string;
  ratingRange: string;
  sentiment: string;
  topic: string;
  tone: string;
  language: string;
  templateText: string;
  active: boolean;
}

export interface ReplyRule {
  id: string;
  businessId: string | null;
  ratingMin: number;
  ratingMax: number;
  autoReplyEnabled: boolean;
  approvalRequired: boolean;
  sensitiveIssueReview: boolean;
}

export const replyService = {
  getReplies: async (businessId: string): Promise<ReplyRecord[]> => {
    if (isSupabaseConfigured() && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('review_replies')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((r: any) => ({
            id: r.id,
            businessId: r.business_id,
            googleReviewId: r.google_review_id,
            replyText: r.reply_text,
            source: r.source,
            status: r.status,
            createdAt: r.created_at,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch replies from Supabase:', err);
      }
    }
    return [];
  },

  saveReplyDraft: async (params: {
    businessId: string;
    googleReviewId: string;
    replyText: string;
    source?: 'manual' | 'smart' | 'auto';
  }): Promise<ReplyRecord> => {
    let replyId = `rep_${Date.now()}`;
    const source = params.source || 'smart';

    if (isSupabaseConfigured() && !params.businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('review_replies')
          .insert({
            business_id: params.businessId,
            google_review_id: params.googleReviewId,
            reply_text: params.replyText,
            source,
            status: 'draft',
          })
          .select('id')
          .single();

        if (!error && data) {
          replyId = data.id;
        }

        await supabase
          .from('google_reviews')
          .update({
            reply_status: 'draft',
            reply_text: params.replyText,
            updated_at: new Date().toISOString(),
          })
          .eq('google_review_id', params.googleReviewId);
      } catch (err) {
        console.warn('Could not save reply draft in Supabase:', err);
      }
    }

    return {
      id: replyId,
      businessId: params.businessId,
      googleReviewId: params.googleReviewId,
      replyText: params.replyText,
      source,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  },

  getTemplates: async (businessId?: string): Promise<ReplyTemplate[]> => {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('reply_templates').select('*').eq('active', true);
        if (businessId && !businessId.startsWith('biz_')) {
          query = query.or(`business_id.eq.${businessId},business_id.is.null`);
        } else {
          query = query.is('business_id', null);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((t: any) => ({
            id: t.id,
            businessId: t.business_id,
            category: t.category || 'General',
            ratingRange: t.rating_range || '5',
            sentiment: t.sentiment || 'positive',
            topic: t.topic || 'General',
            tone: t.tone || 'Warm & Professional',
            language: t.language || 'English',
            templateText: t.template_text,
            active: t.active,
          }));
        }
      } catch (err) {
        console.warn('Could not query reply templates from Supabase:', err);
      }
    }

    return [
      {
        id: 'tpl_1',
        businessId: null,
        category: 'Restaurant',
        ratingRange: '5',
        sentiment: 'positive',
        topic: 'Food & Hospitality',
        tone: 'Warm & Professional',
        language: 'English',
        templateText: 'Thank you so much for visiting us! We are thrilled you loved our offerings. Looking forward to welcoming you back soon!',
        active: true,
      },
      {
        id: 'tpl_2',
        businessId: null,
        category: 'Restaurant',
        ratingRange: '4-5',
        sentiment: 'positive',
        topic: 'Ambiance',
        tone: 'Warm & Professional',
        language: 'English',
        templateText: 'We appreciate your glowing review and kind feedback! Our team works hard to create memorable moments for every guest.',
        active: true,
      }
    ];
  },

  canUseAutoReply: (planStatus?: string): boolean => {
    return planStatus === 'active';
  },

  getRules: async (businessId?: string, planStatus?: string): Promise<ReplyRule> => {
    const isPlanActive = planStatus === 'active';

    if (isSupabaseConfigured() && businessId && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('reply_rules')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            businessId: data.business_id,
            ratingMin: data.rating_min,
            ratingMax: data.rating_max,
            // Strictly false if trial account
            autoReplyEnabled: isPlanActive ? data.auto_reply_enabled : false,
            approvalRequired: data.approval_required,
            sensitiveIssueReview: data.sensitive_issue_review,
          };
        }
      } catch (err) {
        console.warn('Could not query reply rules from Supabase:', err);
      }
    }

    return {
      id: 'default_rule',
      businessId: businessId || null,
      ratingMin: 4,
      ratingMax: 5,
      // Strictly disabled for trial accounts; enabled only on active plan
      autoReplyEnabled: false,
      approvalRequired: true,
      sensitiveIssueReview: true,
    };
  }
};
