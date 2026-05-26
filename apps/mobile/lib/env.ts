import Constants from 'expo-constants';

/**
 * True while the app is running against mock data instead of a real Supabase
 * backend. We use this to:
 *   - render a visible "Demo mode" banner so users aren't misled
 *   - allow a fake-auth bootstrap in onboarding without confusing the UI
 *   - prevent shipping a production build with mock data accidentally
 *
 * Wire this to a real signal (e.g. `Constants.expoConfig?.extra?.supabaseUrl`)
 * once Dev B lands the Supabase client.
 */
export const IS_DEMO_MODE: boolean =
  process.env.EXPO_PUBLIC_AURA_MODE !== 'production';

/**
 * True only for App Store / production channel builds.
 */
export const IS_PRODUCTION_BUILD: boolean =
  Constants.expoConfig?.extra?.eas?.projectId !== '' &&
  process.env.EXPO_PUBLIC_AURA_MODE === 'production';

export const SUPPORT_URL: string =
  (Constants.expoConfig?.extra?.supportUrl as string | undefined) ?? '';

export const PRIVACY_POLICY_URL: string =
  (Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined) ?? '';

export const TERMS_URL: string =
  (Constants.expoConfig?.extra?.termsUrl as string | undefined) ?? '';
