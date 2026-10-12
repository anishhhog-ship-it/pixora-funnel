import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface SupportTicket {
  id: string;
  businessId?: string;
  subject: string;
  description: string;
  category: 'nfc_card' | 'google_review' | 'qr_stand' | 'auto_reply' | 'billing' | 'general';
  status: 'Open' | 'Pending Reply' | 'Resolved';
  priority: 'Normal' | 'High Priority' | 'Urgent';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallbackRequest {
  id: string;
  businessId?: string;
  name: string;
  phone: string;
  preferredTime: string;
  query: string;
  status: 'Pending' | 'Completed';
  createdAt: string;
}

const TICKETS_STORAGE_KEY = 'pixora_support_tickets';
const CALLBACKS_STORAGE_KEY = 'pixora_callback_requests';

const DEFAULT_SEED_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_101',
    subject: 'Welcome assistance & QR stand guidance',
    description: 'Initial onboarding check-in for Google review funnel setup and NFC card instructions.',
    category: 'qr_stand',
    status: 'Resolved',
    priority: 'Normal',
    adminReply: 'Welcome to Pixora! Your QR codes are live and ready for high-resolution table stand printing.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  }
];

export const supportService = {
  /**
   * Retrieves support tickets for a business
   */
  getTickets: async (businessId?: string): Promise<SupportTicket[]> => {
    let cloudTickets: SupportTicket[] = [];

    if (isSupabaseConfigured() && businessId && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          cloudTickets = data.map((t: any) => ({
            id: t.id,
            businessId: t.business_id,
            subject: t.subject,
            description: t.description || '',
            category: t.category || 'general',
            status: t.status || 'Open',
            priority: t.priority || 'Normal',
            adminReply: t.admin_reply || undefined,
            createdAt: t.created_at || new Date().toISOString(),
            updatedAt: t.updated_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Could not fetch Supabase support tickets:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(TICKETS_STORAGE_KEY);
        let localList: SupportTicket[] = stored ? JSON.parse(stored) : [];

        if (localList.length === 0 && cloudTickets.length === 0) {
          localList = DEFAULT_SEED_TICKETS;
          localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(localList));
        }

        const map = new Map<string, SupportTicket>();
        [...cloudTickets, ...localList].forEach(item => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });

        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (e) {}
    }

    return cloudTickets.length > 0 ? cloudTickets : DEFAULT_SEED_TICKETS;
  },

  /**
   * Creates a new support ticket
   */
  createTicket: async (params: {
    businessId?: string;
    subject: string;
    description: string;
    category?: 'nfc_card' | 'google_review' | 'qr_stand' | 'auto_reply' | 'billing' | 'general';
    priority?: 'Normal' | 'High Priority' | 'Urgent';
  }): Promise<SupportTicket> => {
    const newTicket: SupportTicket = {
      id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: params.businessId,
      subject: params.subject,
      description: params.description,
      category: params.category || 'general',
      status: 'Open',
      priority: params.priority || 'Normal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && params.businessId && !params.businessId.startsWith('biz_')) {
      try {
        const { data } = await supabase.from('support_tickets').insert({
          business_id: params.businessId,
          subject: params.subject,
          description: params.description,
          status: 'Open',
          priority: params.priority || 'Normal',
        }).select().single();

        if (data) {
          newTicket.id = data.id;
        }
      } catch (err) {
        console.warn('Could not insert ticket into Supabase:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(TICKETS_STORAGE_KEY);
        const list: SupportTicket[] = stored ? JSON.parse(stored) : [];
        list.unshift(newTicket);
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }

    return newTicket;
  },

  /**
   * Requests a priority callback from support team
   */
  requestCallback: async (params: {
    businessId?: string;
    name: string;
    phone: string;
    preferredTime: string;
    query: string;
  }): Promise<CallbackRequest> => {
    const callback: CallbackRequest = {
      id: `cb_${Date.now()}`,
      businessId: params.businessId,
      name: params.name,
      phone: params.phone,
      preferredTime: params.preferredTime,
      query: params.query,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CALLBACKS_STORAGE_KEY);
        const list: CallbackRequest[] = stored ? JSON.parse(stored) : [];
        list.unshift(callback);
        localStorage.setItem(CALLBACKS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }

    return callback;
  }
};
