import { supabase } from '../lib/supabase';
import { fetchUserByEmail } from './supabaseRepo';

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// Validar se o email está cadastrado no sistema
export async function validateUserEmail(email: string): Promise<boolean> {
  const user = await fetchUserByEmail(email);
  return user !== null;
}

// Google OAuth (Expo)
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

const REDIRECT_SCHEME = 'frequenciapro'; // definido em app.json
const REDIRECT_PATH = 'auth/callback';

export async function signInWithGoogle() {
  // Para web, usar redirect direto. Para mobile, usar proxy do Expo.
  const isWeb = Platform.OS === 'web';
  
  let redirectTo: string;
  if (isWeb) {
    // No web, usar a URL atual como base - garantir que não seja localhost em produção
    const origin = window.location.origin;
    // Se estiver em localhost, manter. Se estiver em produção (vercel.app), usar a URL de produção
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      redirectTo = `${origin}/auth/callback`;
    } else {
      // Em produção, usar a URL atual (que já é a correta)
      redirectTo = `${origin}/auth/callback`;
    }
  } else {
    // No mobile, usar proxy do Expo
    redirectTo = AuthSession.makeRedirectUri({
      useProxy: true,
      scheme: REDIRECT_SCHEME,
      path: REDIRECT_PATH,
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: isWeb ? false : true, // No web, deixar Supabase redirecionar automaticamente
    },
  });
  
  if (error) throw error;

  // No web, o Supabase já redireciona automaticamente
  if (isWeb && data?.url) {
    window.location.href = data.url;
    return; // O redirecionamento vai acontecer
  }

  // No mobile, usar WebBrowser
  if (!isWeb && data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      // Validar se o email está cadastrado
      if (sessionData.session?.user?.email) {
        const isValid = await validateUserEmail(sessionData.session.user.email);
        if (!isValid) {
          await supabase.auth.signOut();
          throw new Error('Acesso não autorizado. Entre em contato com o administrador.');
        }
      }
      
      return sessionData.session;
    }
    throw new Error('Login com Google não concluído');
  }
  
  throw new Error('URL de login não retornada');
}

