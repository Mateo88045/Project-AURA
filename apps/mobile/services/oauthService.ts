import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { supabase } from '@chronos/shared/supabase';

// NOTE: `expo-apple-authentication` is intentionally NOT imported at the top
// level. Its native module isn't bundled in Expo Go, so a static import would
// crash when running there. We `require` it lazily inside `initiateAppleNative`
// after confirming we're in a custom dev client / standalone build.
type AppleAuthModule = typeof import('expo-apple-authentication');

/** True when the app is running inside Expo Go (no custom native modules). */
const isExpoGo = Constants.appOwnership === 'expo';

// Ensure the web browser auth session is ready (warm/dismiss on mount).
WebBrowser.maybeCompleteAuthSession();

// The redirect URI Supabase will send the user back to after OAuth.
// In a custom dev client / standalone build this becomes `aura://auth/callback`.
// In Expo Go it becomes the `exp://...` URL Expo Go is currently running on.
// `makeRedirectUri` picks the right one automatically when given a scheme; both
// values must be added to Supabase Auth → URL Configuration → Redirect URLs.
const redirectUri = makeRedirectUri({ scheme: 'aura', path: 'auth/callback' });

// ---------------------------------------------------------------------------
// Google OAuth — opens an in-app browser, Supabase handles the flow
// ---------------------------------------------------------------------------

/**
 * Result of a successful Google OAuth flow.
 *
 * `providerToken` is the Google access token (bearer token for Classroom API).
 * `providerRefreshToken` is the Google refresh token — used by the backend
 * (Trigger.dev Classroom fetch job) to obtain a fresh access token when the
 * current one expires. Persist both to the `connections` table.
 */
export interface GoogleOAuthResult {
  providerToken: string;
  providerRefreshToken: string;
}

export async function initiateGoogleOAuth(): Promise<GoogleOAuthResult | null> {
  // 1. Ask Supabase for the OAuth URL
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      scopes:
        'https://www.googleapis.com/auth/classroom.courses.readonly ' +
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error || !data.url) {
    console.warn('[OAuth] Failed to get Google OAuth URL:', error?.message);
    return null;
  }

  // 2. Open the URL in an in-app browser and wait for redirect
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== 'success') {
    // User cancelled or dismissed
    return null;
  }

  // 3. Extract tokens from the redirect URL fragment
  const url = new URL(result.url);
  // Supabase puts tokens in the hash fragment:
  //   #access_token=...&refresh_token=...&provider_token=...&provider_refresh_token=...
  const params = new URLSearchParams(url.hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  // Google's own OAuth tokens (passed through by Supabase because
  // access_type=offline + prompt=consent are set in queryParams above).
  const providerToken = params.get('provider_token');
  const providerRefreshToken = params.get('provider_refresh_token') ?? '';

  if (!accessToken || !refreshToken) {
    console.warn('[OAuth] Missing tokens in redirect URL');
    return null;
  }

  // 4. Set the session in Supabase client
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    console.warn('[OAuth] Failed to set session:', sessionError.message);
    return null;
  }

  // 5. Surface Google provider tokens to the caller so they can be persisted
  //    into the `connections` table. If Supabase didn't return a provider
  //    token, the Google provider likely isn't configured in the dashboard.
  if (!providerToken) {
    console.warn(
      '[OAuth] No provider_token in redirect — check Supabase Google provider config',
    );
    return null;
  }

  return { providerToken, providerRefreshToken };
}

// ---------------------------------------------------------------------------
// Apple Sign In — native on iOS, Supabase OAuth fallback on other platforms
// ---------------------------------------------------------------------------

/**
 * True when native Apple Sign-In is supported in the current runtime.
 * iOS standalone / dev-client only — Expo Go doesn't ship the native module.
 * Use this from UI code to hide the "Continue with Apple" button when running
 * in Expo Go (otherwise tapping it just no-ops with a console warning).
 */
export const isAppleSignInAvailable = Platform.OS === 'ios' && !isExpoGo;

export async function initiateAppleSignIn(): Promise<boolean> {
  if (isAppleSignInAvailable) {
    return initiateAppleNative();
  }
  if (isExpoGo) {
    console.warn(
      '[Apple] Sign-In is unavailable in Expo Go (native module not bundled). ' +
      'Use a custom dev client or standalone build to test Apple auth.',
    );
    return false;
  }
  // Non-iOS standalone (shouldn't happen — app is iOS-only — but defensive)
  return initiateAppleOAuth();
}

/** Native Apple Sign In (iOS dev-client/standalone only). */
async function initiateAppleNative(): Promise<boolean> {
  let AppleAuthentication: AppleAuthModule;
  try {
    // Lazy require — the native module isn't in Expo Go, so a top-level import
    // would crash there. `isAppleSignInAvailable` guards the call site, but we
    // also catch here as a belt-and-braces measure.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    AppleAuthentication = require('expo-apple-authentication');
  } catch {
    console.warn('[Apple] expo-apple-authentication native module not available');
    return false;
  }

  try {
    // Generate a nonce for security
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      console.warn('[Apple] No identity token returned');
      return false;
    }

    // Exchange the Apple ID token for a Supabase session
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce, // Send the raw (unhashed) nonce — Supabase hashes it server-side
    });

    if (error) {
      console.warn('[Apple] Supabase signInWithIdToken failed:', error.message);
      return false;
    }

    return true;
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED') {
      // User cancelled — not an error
      return false;
    }
    console.warn('[Apple] Sign in failed:', err);
    return false;
  }
}

/** Supabase OAuth fallback for Apple (web/Android). */
async function initiateAppleOAuth(): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: redirectUri },
  });

  if (error || !data.url) {
    console.warn('[OAuth] Failed to get Apple OAuth URL:', error?.message);
    return false;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== 'success') return false;

  const url = new URL(result.url);
  const params = new URLSearchParams(url.hash.substring(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) return false;

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return !sessionError;
}

// ---------------------------------------------------------------------------
// Canvas token (unchanged)
// ---------------------------------------------------------------------------

export async function saveCanvasToken(
  userId: string,
  token: string,
): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .upsert(
      {
        user_id: userId,
        platform: 'canvas',
        canvas_api_token: token,
        status: 'active',
      },
      { onConflict: 'user_id,platform' },
    );

  if (error) {
    throw new Error(`Failed to save Canvas token: ${error.message}`);
  }
}
