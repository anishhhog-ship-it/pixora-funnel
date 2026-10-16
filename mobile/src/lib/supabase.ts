import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Database } from '../types/database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wpjkmzwzijxzdldtaktz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isMobileSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch {
        // Web storage can be disabled; the in-memory session still works.
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } catch {
        // Web storage can be disabled.
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey || 'dummy-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage,
    },
  }
);
