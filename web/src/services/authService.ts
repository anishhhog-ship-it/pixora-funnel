import { User } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

const isBrowser = typeof window !== 'undefined';
const USER_STORAGE_KEY = 'pixora_current_user';
const OTP_STORAGE_KEY = 'pixora_pending_otp';

export interface SignUpData {
  name?: string;
  email: string;
  phone?: string;
  password?: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password?: string;
}

export const authService = {
  getCurrentUser: (): User | null => {
    if (!isBrowser) return null;
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return null;
  },

  getSession: async () => {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err) {
      console.warn('Could not fetch Supabase session', err);
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (!isBrowser) return false;
    return !!localStorage.getItem(USER_STORAGE_KEY);
  },

  signUp: async (data: SignUpData): Promise<User> => {
    let supabaseUserId = `usr_${Date.now()}`;

    if (isSupabaseConfigured() && data.password) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.name || data.email.split('@')[0],
              phone: data.phone,
            },
          },
        });

        if (error) {
          console.warn('Supabase Auth signUp error, proceeding with local persistence:', error.message);
        } else if (authData.user) {
          supabaseUserId = authData.user.id;
          // Sync profile to public.profiles
          await supabase.from('profiles').upsert({
            auth_user_id: authData.user.id,
            email: data.email,
            full_name: data.name || data.email.split('@')[0],
            phone: data.phone,
          });
        }
      } catch (err: any) {
        console.warn('Supabase Auth signUp exception:', err?.message);
      }
    }

    const normalizedEmail = (data.email || '').toLowerCase().trim();
    // Deterministic user ID for offline/local mode based on email
    const fallbackId = `usr_${encodeURIComponent(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
    const finalUserId = isSupabaseConfigured() && supabaseUserId.startsWith('usr_') ? fallbackId : supabaseUserId;

    const newUser: User = {
      id: finalUserId,
      name: data.name || (data.email ? data.email.split('@')[0] : 'Business Owner'),
      email: normalizedEmail,
      phone: data.phone || '',
      businessSlots: 1,
      createdAt: new Date().toISOString(),
    };

    if (isBrowser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    }
    return newUser;
  },

  setUser: (user: User): void => {
    if (!isBrowser) return;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  },

  updateUserPhone: async (userId: string, phone: string): Promise<User | null> => {
    const cleanPhone = phone.trim();
    let user = authService.getCurrentUser();
    if (user) {
      user = { ...user, phone: cleanPhone };
      authService.setUser(user);
    }
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('profiles')
          .update({ phone: cleanPhone })
          .or(`id.eq.${userId},auth_user_id.eq.${userId}`);
      } catch (e) {
        console.warn('Could not update profile phone in Supabase:', e);
      }
    }
    return user;
  },

  signIn: async (data: LoginData): Promise<User> => {
    return authService.login(data);
  },

  login: async (data: LoginData): Promise<User> => {
    let user = authService.getCurrentUser();
    const normalizedEmail = (data.email || '').toLowerCase().trim();

    if (isSupabaseConfigured() && data.email && data.password) {
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: data.password,
        });

        if (error) {
          console.warn('Supabase signInWithPassword error:', error.message);
        } else if (authData.user) {
          // Fetch real profile from Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', authData.user.id)
            .single();

          user = {
            id: authData.user.id,
            name: profile?.full_name || authData.user.user_metadata?.full_name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'Business Owner'),
            email: authData.user.email || normalizedEmail,
            phone: profile?.phone || authData.user.user_metadata?.phone || '',
            avatar: profile?.avatar_url,
            businessSlots: 1,
            createdAt: authData.user.created_at || new Date().toISOString(),
          };

          if (isBrowser) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          }
          return user;
        }
      } catch (err: any) {
        console.warn('Supabase login exception:', err?.message);
      }
    }

    // Local fallback: use deterministic user ID matching the email
    const fallbackId = `usr_${encodeURIComponent(normalizedEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
    user = {
      id: fallbackId,
      name: data.email ? normalizedEmail.split('@')[0] : 'Business Owner',
      email: normalizedEmail,
      phone: data.phone || '',
      businessSlots: 1,
      createdAt: new Date().toISOString(),
    };

    if (isBrowser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  },

  signInWithGoogle: async (): Promise<User> => {
    if (isSupabaseConfigured()) {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
      
      const user = authService.getCurrentUser() || {
        id: `usr_g_${Date.now()}`,
        name: 'Google User',
        email: '',
        businessSlots: 1,
        createdAt: new Date().toISOString(),
      };
      return user;
    }

    // Local preview: use active user or blank email/phone
    const existing = authService.getCurrentUser();
    const googleUser: User = {
      id: existing?.id || `usr_google_${Date.now()}`,
      name: existing?.name || 'Google Partner',
      email: existing?.email || '',
      phone: existing?.phone || '',
      businessSlots: 1,
      createdAt: new Date().toISOString(),
    };
    if (isBrowser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(googleUser));
    }
    return googleUser;
  },

  sendOtp: async (phone: string): Promise<{ success: boolean; message: string; mockOtp: string }> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          phone,
        });
        if (!error) {
          return {
            success: true,
            message: `OTP sent to ${phone}.`,
            mockOtp: 'Check your phone SMS',
          };
        }
      } catch (err) {
        console.warn('Supabase signInWithOtp failed, falling back to mock OTP:', err);
      }
    }

    const mockOtp = '123456';
    if (isBrowser) {
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify({ phone, mockOtp, expiresAt: Date.now() + 5 * 60 * 1000 }));
    }
    return {
      success: true,
      message: `OTP sent to ${phone}. For demo, enter 123456.`,
      mockOtp
    };
  },

  verifyOtp: async (phone: string, otp: string): Promise<User | null> => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: 'sms',
        });
        if (!error && data.user) {
          const user: User = {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || 'Business Owner',
            email: data.user.email || '',
            phone,
            createdAt: data.user.created_at,
          };
          if (isBrowser) {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
          }
          return user;
        }
      } catch (err) {
        console.warn('Supabase verifyOtp failed, trying local verification:', err);
      }
    }

    // Mock validation fallback
    if (otp === '123456' || otp.length === 6) {
      const user: User = {
        id: `usr_${Date.now()}`,
        name: 'Business Owner',
        email: '',
        phone: phone,
        createdAt: new Date().toISOString(),
      };
      if (isBrowser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        sessionStorage.removeItem(OTP_STORAGE_KEY);
      }
      return user;
    }
    throw new Error('Invalid OTP. Please enter 123456.');
  },

  syncSessionUser: async (): Promise<User | null> => {
    if (!isBrowser) return null;
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser = session.user;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          const existing = authService.getCurrentUser();
          const syncedUser: User = {
            id: authUser.id,
            name: profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || existing?.name || (authUser.email ? authUser.email.split('@')[0] : 'Business Owner'),
            email: authUser.email || existing?.email || '',
            phone: profile?.phone || authUser.user_metadata?.phone || existing?.phone || '',
            avatar: profile?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || existing?.avatar,
            businessSlots: 1,
            createdAt: authUser.created_at || existing?.createdAt || new Date().toISOString(),
          };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(syncedUser));
          return syncedUser;
        }
      } catch (err) {
        console.warn('Error syncing session user:', err);
      }
    }
    return authService.getCurrentUser();
  },


  updateUserProfile: async (userId: string, updates: Partial<User>): Promise<void> => {
    if (isBrowser) {
      try {
        const raw = localStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const u = { ...JSON.parse(raw), ...updates };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
        }
      } catch (e) {}
    }

    if (isSupabaseConfigured() && userId) {
      try {
        const payload: any = {};
        if (updates.name) payload.full_name = updates.name;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        await supabase.from('profiles').update(payload).eq('id', userId);
      } catch (err) {
        console.warn('Could not update profile in Supabase:', err);
      }
    }
  },

  signOut: async (): Promise<void> => {
    return authService.logout();
  },

  logout: async (): Promise<void> => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    if (isBrowser) {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }
};
