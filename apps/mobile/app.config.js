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
      // Privacy manifest — MUST stay in sync with PRIVACY_POLICY.md and with
      // the App Store Connect "App Privacy" nutrition label (a separate web
      // form that Apple requires you to complete to match this).
      // None of these are used for tracking (NSPrivacyTracking: false); all
      // are collected only to run the app. Crash/performance data is scrubbed
      // of user identity and content (see app/_layout.tsx Sentry config).
      privacyManifests: {
        NSPrivacyTracking: false,
        NSPrivacyTrackingDomains: [],
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1', '0A2A.1', '3B52.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
            NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
            NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
          },
        ],
        NSPrivacyCollectedDataTypes: [
          // Account identity — linked to the user, app functionality only.
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeName',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeUserID',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
          // Assignments, photos submitted for OCR, copilot chats, onboarding answers.
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherUserContent',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
          // RevenueCat subscription/purchase events.
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePurchaseHistory',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
          // Sentry crash + performance diagnostics — scrubbed of identity/content,
          // so declared as not linked to the user.
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePerformanceData',
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
          },
        ],
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
