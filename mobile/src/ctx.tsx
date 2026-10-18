import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { router, SplashScreen } from 'expo-router';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { isMobileSupabaseConfigured, supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useSession(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(() => isMobileSupabaseConfigured());
  const [error, setError] = useState<string | null>(() => isMobileSupabaseConfigured() ? null : 'Supabase is not configured for this build. Add the public mobile environment variables and restart Expo.');

  useEffect(() => {
    let mounted = true;

    if (!isMobileSupabaseConfigured()) return () => { mounted = false; };

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setError(null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user || null,
    isLoading,
    error,
    signIn: async (email, password) => {
      setError(null);
      if (!isMobileSupabaseConfigured()) throw new Error('Supabase is not configured for this build.');
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        throw signInError;
      }
      router.replace('/');
    },
    sendPasswordReset: async (email) => {
      setError(null);
      if (!isMobileSupabaseConfigured()) throw new Error('Supabase is not configured for this build.');
      const redirectTo = Linking.createURL('/reset-password');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
      if (resetError) {
        setError(resetError.message);
        throw resetError;
      }
    },
    updatePassword: async (password) => {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      router.replace('/');
    },
    signOut: async () => {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        throw signOutError;
      }
    },
  }), [error, isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function SplashScreenController() {
  const { isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => undefined);
  }, [isLoading]);

  return null;
}
