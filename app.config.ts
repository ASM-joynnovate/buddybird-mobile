// app.config.ts
import type { ConfigContext, ExpoConfig } from 'expo/config';

import pkg from './package.json';

declare const require: (moduleName: string) => { version?: string };

const APP_NAME = '버디버드';
// 브랜드/아이콘 배경 (어댑티브 아이콘). 스플래시 배경과 색이 다르므로 분리.
const BRAND_BACKGROUND_COLOR = '#E0010E';
// 스플래시 전용 배경 — in-app 스플래시(splashRed)와 일치시켜 네이티브→in-app 핸드오프를 끊김 없이.
const SPLASH_BACKGROUND_COLOR = '#DB030F';

const TRACKING_PERMISSION_MESSAGE =
    '더 나은 학습 경험과 앱 개선을 위해 화면 사용 기록과 익명 사용 통계를 수집합니다. 개인을 식별하는 정보는 수집하지 않으며, 언제든지 거부할 수 있습니다.';

const MICROPHONE_PERMISSION_MESSAGE =
    '버디버드가 반려조 학습용 목소리를 녹음할 수 있도록 마이크 접근을 허용해 주세요.';

type AppVariant = 'development' | 'production';

const resolveAppVariant = (): AppVariant =>
    process.env.APP_VARIANT === 'production' ? 'production' : 'development';

const APP_VARIANT = resolveAppVariant();
const IS_DEV = APP_VARIANT === 'development';

const BUNDLE_ID_BASE = 'com.joynnovate.buddybird';
const BUNDLE_ID = IS_DEV ? `${BUNDLE_ID_BASE}.dev` : BUNDLE_ID_BASE;
const SCHEME = IS_DEV ? 'buddybird-dev' : 'buddybird';
const DISPLAY_NAME = IS_DEV ? `${APP_NAME} (DEV)` : APP_NAME;

const IOS_GOOGLE_SERVICES_FILE =
    process.env.GOOGLE_SERVICES_INFO_PLIST ??
    (IS_DEV
        ? './config/dev/firebase/GoogleService-Info.plist'
        : './config/prod/firebase/GoogleService-Info.plist');

const ANDROID_GOOGLE_SERVICES_FILE =
    process.env.GOOGLE_SERVICES_JSON ??
    (IS_DEV
        ? './config/dev/firebase/google-services.json'
        : './config/prod/firebase/google-services.json');

const getExpoMajorVersion = (): number | null => {
    try {
        const { version } = require('expo/package.json');
        const majorVersion = Number(version?.split('.')[0]);

        return Number.isFinite(majorVersion) ? majorVersion : null;
    } catch {
        return null;
    }
};

const expoMajorVersion = getExpoMajorVersion();

/**
 * Expo SDK 55부터는 newArchEnabled와 android.edgeToEdgeEnabled가 app config에서 제거되었습니다.
 * SDK 54 이하에서는 기존 app.json 동작을 보존하기 위해 유지합니다.
 */
const shouldKeepSdk54CompatConfig =
    expoMajorVersion !== null && expoMajorVersion < 55;

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,

    ...(shouldKeepSdk54CompatConfig
        ? {
            newArchEnabled: true,
        }
        : {}),

    name: DISPLAY_NAME,
    slug: 'buddybird',
    version: pkg.version,
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: SCHEME,
    userInterfaceStyle: 'automatic',

    ios: {
        supportsTablet: true,
        bundleIdentifier: BUNDLE_ID,
        googleServicesFile: IOS_GOOGLE_SERVICES_FILE,
        // HTTPS/TLS·OS 표준 암호화만 사용 (Firebase 포함) — 수출규정 면제.
        // App Store 빌드가 Missing Compliance 대신 Ready to Submit 으로 들어오게 한다.
        config: {
            usesNonExemptEncryption: false,
        },
        entitlements: {
            'aps-environment': IS_DEV ? 'development' : 'production',
        },
        infoPlist: {
            NSUserTrackingUsageDescription: TRACKING_PERMISSION_MESSAGE,
            UIBackgroundModes: ['remote-notification'],
        },
    },

    android: {
        package: BUNDLE_ID,
        googleServicesFile: ANDROID_GOOGLE_SERVICES_FILE,
        adaptiveIcon: {
            backgroundColor: BRAND_BACKGROUND_COLOR,
            foregroundImage: './assets/images/android-icon-foreground.png'
        },

        ...(shouldKeepSdk54CompatConfig
            ? {
                edgeToEdgeEnabled: true,
            }
            : {}),

        predictiveBackGestureEnabled: false,
        permissions: [
            'android.permission.RECORD_AUDIO',
            'android.permission.MODIFY_AUDIO_SETTINGS',
            'android.permission.POST_NOTIFICATIONS',
            'com.google.android.gms.permission.AD_ID',
        ],
    },

    web: {
        output: 'static',
        favicon: './assets/images/favicon.ico',
    },

    plugins: [
        'expo-router',
        'expo-asset',
        [
            'expo-font',
            {
                fonts: [
                    './node_modules/@expo-google-fonts/fredoka/600SemiBold/Fredoka_600SemiBold.ttf',
                    './node_modules/@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf',
                    './node_modules/@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf',
                    './node_modules/@expo-google-fonts/nunito/900Black/Nunito_900Black.ttf',
                    './assets/fonts/Pretendard-Regular.otf',
                    './assets/fonts/Pretendard-Bold.otf',
                    './assets/fonts/Pretendard-ExtraBold.otf',
                    './assets/fonts/Pretendard-Black.otf',
                ],
            },
        ],
        [
            'expo-splash-screen',
            {
                image: './assets/images/splash-wordmark.png',
                imageWidth: 288,
                resizeMode: 'contain',
                backgroundColor: SPLASH_BACKGROUND_COLOR,
                dark: {
                    backgroundColor: SPLASH_BACKGROUND_COLOR,
                },
            },
        ],
        [
            'expo-audio',
            {
                microphonePermission: MICROPHONE_PERMISSION_MESSAGE,
            },
        ],
        '@react-native-firebase/app',
        '@react-native-firebase/crashlytics',
        '@react-native-firebase/messaging',
        [
            'expo-tracking-transparency',
            {
                userTrackingPermission: TRACKING_PERMISSION_MESSAGE,
            },
        ],
        [
            'expo-build-properties',
            {
                ios: {
                    useFrameworks: 'static',
                    forceStaticLinking: [
                        'RNFBApp',
                        'RNFBAnalytics',
                        'RNFBCrashlytics',
                        'RNFBMessaging',
                    ],
                },
            },
        ],
        './plugins/withFirebaseStaticPodfile',
        './plugins/withGradleJvmArgs',
    ],

    extra: {
        appVariant: APP_VARIANT,
        clarityProjectId: 'wre3hgbj48',
        router: {},
        eas: {
            projectId: 'f00b95df-f52f-4021-8543-47971d4fa55e',
        },
    },

    experiments: {
        typedRoutes: true,
        reactCompiler: true,
    },

    owner: 'joynnovate0410',
});
