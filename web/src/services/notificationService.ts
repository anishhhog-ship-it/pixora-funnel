import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface NotificationItem {
  id: string;
  businessId?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'admin_broadcast' | 'ticket_reply' | 'system' | 'review' | 'trial';
  read: boolean;
  link?: string;
  createdAt: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'pixora_client_notifications';

// Default seed notifications from Admin Panel so clients have realistic data out of the box
const DEFAULT_SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_admin_welcome',
    title: '🎉 Welcome to Pixora Funnel Platform',
    message: 'Your Google review conversion system is now live. Share your QR code and set up NFC cards to start collecting 5-star ratings.',
    type: 'admin_broadcast',
    read: false,
    link: '/dashboard/qr',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif_admin_system',
    title: '📢 Admin Announcement: New WhatsApp Support Channel',
    message: 'Our priority 24/7 dedicated support team is now available via WhatsApp and direct hotline in your new Support & Helpdesk center.',
    type: 'admin_broadcast',
    read: false,
    link: '/dashboard/support',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'notif_nfc_guide',
    title: '💳 NFC Card Activation Ready',
    message: 'NFC Smart Tap Cards can now be configured and linked directly to your Google Review funnel.',
    type: 'system',
    read: true,
    link: '/dashboard/qr',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

export const notificationService = {
  /**
   * Retrieves notifications for a business, combining live Supabase records
   * and admin broadcasts with local cache fallbacks.
   */
  getNotifications: async (businessId?: string): Promise<NotificationItem[]> => {
    let cloudNotifications: NotificationItem[] = [];

    if (isSupabaseConfigured() && businessId && !businessId.startsWith('biz_')) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`business_id.eq.${businessId},business_id.is.null`)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && data) {
          cloudNotifications = data.map((n: any) => ({
            id: n.id,
            businessId: n.business_id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type || 'admin_broadcast',
            read: n.read ?? false,
            link: n.link || undefined,
            createdAt: n.created_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Could not fetch Supabase notifications, using local fallback:', err);
      }
    }

    // Local Storage Layer
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        let localList: NotificationItem[] = stored ? JSON.parse(stored) : [];

        // If local list is empty, initialize with default seed notifications
        if (localList.length === 0) {
          localList = DEFAULT_SEED_NOTIFICATIONS;
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(localList));
        }

        // Merge cloud & local (deduplicate by id)
        const map = new Map<string, NotificationItem>();
        [...cloudNotifications, ...localList].forEach(item => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });

        return Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (e) {
        console.warn('Error accessing local notifications:', e);
      }
    }

    return cloudNotifications.length > 0 ? cloudNotifications : DEFAULT_SEED_NOTIFICATIONS;
  },

  /**
   * Marks a single notification as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    if (isSupabaseConfigured() && !notificationId.startsWith('notif_')) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      } catch (e) {
        console.warn('Could not mark notification read in Supabase:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
          const list: NotificationItem[] = JSON.parse(stored);
          const updated = list.map(item => item.id === notificationId ? { ...item, read: true } : item);
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (e) {}
    }
  },

  /**
   * Marks all notifications as read
   */
  markAllAsRead: async (businessId?: string): Promise<void> => {
    if (isSupabaseConfigured() && businessId && !businessId.startsWith('biz_')) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('business_id', businessId);
      } catch (e) {
        console.warn('Could not mark all notifications read in Supabase:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (stored) {
          const list: NotificationItem[] = JSON.parse(stored);
          const updated = list.map(item => ({ ...item, read: true }));
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (e) {}
    }
  },

  /**
   * Broadcasts / creates a new notification (used by Admin Panel or system triggers)
   */
  sendNotification: async (payload: {
    businessId?: string;
    userId?: string;
    title: string;
    message: string;
    type?: 'admin_broadcast' | 'ticket_reply' | 'system' | 'review' | 'trial';
    link?: string;
  }): Promise<NotificationItem> => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      businessId: payload.businessId,
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'admin_broadcast',
      read: false,
      link: payload.link,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && payload.businessId && !payload.businessId.startsWith('biz_')) {
      try {
        await supabase.from('notifications').insert({
          business_id: payload.businessId,
          user_id: payload.userId || null,
          title: payload.title,
          message: payload.message,
          type: newNotif.type,
          read: false,
        });
      } catch (e) {
        console.warn('Could not insert notification into Supabase:', e);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        const list: NotificationItem[] = stored ? JSON.parse(stored) : [];
        list.unshift(newNotif);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('pixora:new_notification', { detail: newNotif }));
      } catch (e) {}
    }

    return newNotif;
  },

  /**
   * Subscribes to live notifications for a business via Supabase Realtime channel and local events
   */
  subscribeToNotifications: (
    businessId: string | undefined, 
    callback: (notification: NotificationItem) => void
  ): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    let channel: any = null;
    if (isSupabaseConfigured() && businessId && !businessId.startsWith('biz_')) {
      try {
        channel = supabase
          .channel(`public:notifications:${businessId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `business_id=eq.${businessId}`,
            },
            (payload: any) => {
              const n = payload.new;
              if (n) {
                callback({
                  id: n.id,
                  businessId: n.business_id,
                  userId: n.user_id,
                  title: n.title,
                  message: n.message,
                  type: n.type || 'admin_broadcast',
                  read: n.read ?? false,
                  link: n.link,
                  createdAt: n.created_at || new Date().toISOString(),
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription error:', err);
      }
    }

    const handleLocalBroadcast = (e: any) => {
      if (e?.detail) {
        callback(e.detail);
      }
    };

    window.addEventListener('pixora:new_notification', handleLocalBroadcast);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('pixora:new_notification', handleLocalBroadcast);
    };
  }
};
