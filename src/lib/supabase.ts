import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Dados do seu projeto Supabase
const supabaseUrl = 'https://lpwsggnkwbyyjcytuiwh.supabase.co';
const supabaseAnonKey = 'sb_publishable_fsGzRZs4YBuIAlX424CrTQ_oFUI549O';

// Adaptador para SecureStore (armazenamento seguro de tokens de sessão) – apenas mobile.
const secureStoreAdapter = {
  getItem: async (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

const isWeb = Platform.OS === 'web';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // No web, usamos o storage padrão (localStorage). No mobile, usamos SecureStore.
    storage: isWeb ? undefined : secureStoreAdapter,
  },
});

