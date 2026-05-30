import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { getSupabase, getSupabaseOrNull } from '../lib/supabase';
import { clearSession } from '../lib/storage';

const REDIRECT_URL = Linking.createURL('auth/callback');

/**
 * True when Sign in with Apple is available on this device. iOS 13+ only.
 * Required by App Store Guideline 4.8 whenever any third-party login is offered.
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Send a magic link / one-time code to the user's email. */
export async function signInWithEmail(email: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: REDIRECT_URL, shouldCreateUser: true },
  });
  if (error) throw new Error(error.message);
}

/** Verify the 6-digit code sent to email. */
export async function verifyEmailCode(email: string, token: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new Error(error.message);
}

/** Google OAuth — opens system browser, returns once the redirect fires. */
export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URL,
      scopes: 'openid email profile https://www.googleapis.com/auth/classroom.coursework.me.readonly https://www.googleapis.com/auth/classroom.courses.readonly',
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw new Error(error.message);
}

/**
 * Sign in with Apple — required by App Store Guideline 4.8 since Google is
 * offered. Uses the native Apple credential flow and exchanges the resulting
 * identity token with Supabase Auth.
 */
export async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple sign-in did not return an identity token.');
  }

  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    // Supabase optionally accepts the raw nonce when present — Apple's native
    // flow doesn't return it, so we omit it.
  });
  if (error) throw new Error(error.message);
}

/** Sign out everywhere — clears server session, then local secure storage. */
export async function signOut(): Promise<void> {
  const supabase = getSupabaseOrNull();
  if (supabase) {
    await supabase.auth.signOut().catch(() => {
      // Even if the server call fails, clear local credentials below.
    });
  }
  await clearSession();
}
