import * as Linking from 'expo-linking';
import { getSupabase, getSupabaseOrNull } from '../lib/supabase';
import { clearSession } from '../lib/storage';

const REDIRECT_URL = Linking.createURL('auth/callback');

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
