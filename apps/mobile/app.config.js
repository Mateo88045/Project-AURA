import 'dotenv/config';

export default {
  expo: {
    name: 'Chronos',
    slug: 'chronos',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'chronos',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0A1118',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.chronos.app',
      usesAppleSignIn: true,
      // expo-notifications reads/writes its installation ID and server
      // registration info in the keychain (kSecClassGenericPassword). Without a
      // keychain-access-group entitlement, those calls fail with
      // errSecMissingEntitlement (-34018) on the simulator, surfacing as
      // "[expo-notifications] Error reading persisted server registration info".
      entitlements: {
        'keychain-access-groups': ['$(AppIdentifierPrefix)com.chronos.app'],
      },
      infoPlist: {
        NSUserNotificationsUsageDescription:
          'Chronos sends reminders for your scheduled study blocks and daily assignment updates.',
        NSCameraUsageDescription:
          'Chronos uses the camera so you can photograph an assignment and have it scheduled automatically.',
        NSPhotoLibraryUsageDescription:
          'Chronos lets you pick a photo of an assignment from your library to schedule it automatically.',
        UIBackgroundModes: ['remote-notification'],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0A1118',
      },
      package: 'com.chronos.app',
      permissions: [
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.VIBRATE',
      ],
    },
    plugins: [
      'expo-router',
      'expo-apple-authentication',
      'expo-dev-client',
      [
        'expo-notifications',
        {
          color: '#A8DADC',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Chronos lets you pick a photo of an assignment from your library to schedule it automatically.',
          cameraPermission:
            'Chronos uses the camera so you can photograph an assignment and have it scheduled automatically.',
        },
      ],
      '@sentry/react-native/expo',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '6906e00a-7b2d-4575-b484-4643879ae660',
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      auraApiUrl: process.env.EXPO_PUBLIC_AURA_API_URL ?? '',
      auraApiKey: process.env.EXPO_PUBLIC_AURA_API_KEY ?? '',
      supportUrl: 'https://chronos-app.com/support',
      privacyPolicyUrl: 'https://chronos-app.com/privacy',
      termsUrl: 'https://chronos-app.com/terms',
    },
  },
};
