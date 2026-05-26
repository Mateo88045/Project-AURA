import Constants from 'expo-constants';
import { IS_SUPABASE_CONFIGURED } from './supabase';

/**
 * True when the app is running against mock data instead of the real Supabase
 * backend. Flips automatically based on whether the Supabase URL + publishable
 * key are configured in `app.json` extras (or env). Used to:
 *   - render a visible "Demo mode" banner so users aren't misled
 *   - allow a fake-auth bootstrap in onboarding without confusing the UI
 *   - prevent shipping a production build accidentally pointed at nothing
 */
export const IS_DEMO_MODE: boolean = !IS_SUPABASE_CONFIGURED;

/**
 * True only for App Store / production channel builds with a real EAS project.
 */
export const IS_PRODUCTION_BUILD: boolean =
  (Constants.expoConfig?.extra?.eas?.projectId ?? '') !== '' &&
  process.env.EXPO_PUBLIC_AURA_MODE === 'production';

export const SUPPORT_URL: string =
  (Constants.expoConfig?.extra?.supportUrl as string | undefined) ?? '';

export const PRIVACY_POLICY_URL: string =
  (Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined) ?? '';

export const TERMS_URL: string =
  (Constants.expoConfig?.extra?.termsUrl as string | undefined) ?? '';
