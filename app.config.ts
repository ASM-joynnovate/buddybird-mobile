import type { ExpoConfig } from 'expo/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const { version } = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8')) as {
	version: string;
};

const production = process.env.APP_VARIANT === 'production';
const variant = production ? 'prod' : 'dev';
const id = production ? 'com.joynnovate.buddybird' : 'com.joynnovate.buddybird.dev';
const appNameSuffix = production ? '' : ' (DEV)';

/** 언어별 네이티브 문구 생성 함수 */
const nativeLocale = (file: string) => {
	const { ios, android } = JSON.parse(readFileSync(path.join(__dirname, file), 'utf8')) as {
		ios: Record<string, string>;
		android: Record<string, string>;
	};

	const localizedIos: Record<string, string> = {
		...ios,
		CFBundleDisplayName: `${ios.CFBundleDisplayName}${appNameSuffix}`,
	};
	const localizedAndroid: Record<string, string> = { ...android, app_name: `${android.app_name}${appNameSuffix}` };

	return { ios: localizedIos, android: localizedAndroid };
};

interface SentryProject {
	organization: string;
	project: string;
}

const englishNative = nativeLocale('app/i18n/native/en.json');
const sentryProject = JSON.parse(readFileSync(path.join(__dirname, 'sentry.project.json'), 'utf8')) as SentryProject;

const config: ExpoConfig = {
	name: `BuddyBird${appNameSuffix}`,
	slug: 'buddybird',
	owner: 'joynnovate0410',
	version,
	orientation: 'default',
	scheme: production ? 'buddybird' : 'buddybird-dev',
	userInterfaceStyle: 'automatic',
	locales: {
		ko: nativeLocale('app/i18n/native/ko.json'),
		en: englishNative,
		ja: nativeLocale('app/i18n/native/ja.json'),
		ru: nativeLocale('app/i18n/native/ru.json'),
		es: nativeLocale('app/i18n/native/es.json'),
	},
	icon: './assets/images/icon.png',
	ios: {
		bundleIdentifier: id,
		appleTeamId: '73TZC3K2JG',
		usesAppleSignIn: true,
		supportsTablet: true,
		googleServicesFile:
			process.env.GOOGLE_SERVICES_INFO_PLIST ?? `./config/${variant}/firebase/GoogleService-Info.plist`,
		entitlements: { 'aps-environment': production ? 'production' : 'development' },
		infoPlist: {
			CFBundleName: 'BuddyBird',
			CFBundleAllowMixedLocalizations: true,
			ITSAppUsesNonExemptEncryption: false,
			UIBackgroundModes: ['audio', 'remote-notification'],
			NSMicrophoneUsageDescription: englishNative.ios.NSMicrophoneUsageDescription,
			NSPhotoLibraryUsageDescription: englishNative.ios.NSPhotoLibraryUsageDescription,
			NSCameraUsageDescription: englishNative.ios.NSCameraUsageDescription,
		},
	},
	android: {
		package: id,
		googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? `./config/${variant}/firebase/google-services.json`,
		adaptiveIcon: {
			foregroundImage: './assets/images/android-icon-foreground.png',
			backgroundColor: '#E0010E',
		},
		permissions: [
			'RECORD_AUDIO',
			'MODIFY_AUDIO_SETTINGS',
			'POST_NOTIFICATIONS',
			'FOREGROUND_SERVICE',
			'FOREGROUND_SERVICE_MICROPHONE',
			'FOREGROUND_SERVICE_MEDIA_PLAYBACK',
			'com.google.android.gms.permission.AD_ID',
		],
		// WebRTC 플러그인의 미사용 권한
		blockedPermissions: ['android.permission.SYSTEM_ALERT_WINDOW', 'android.permission.BLUETOOTH'],
	},
	plugins: [
		'./plugins/with-android-build-memory',
		['@react-native-firebase/app', { ios: { disableSPM: true } }],
		'@react-native-firebase/crashlytics',
		[
			'@sentry/react-native/expo',
			{
				url: 'https://sentry.io/',
				...sentryProject,
				useNativeInit: true,
			},
		],
		[
			'expo-build-properties',
			{
				android: {
					enableMinifyInReleaseBuilds: true,
					enableShrinkResourcesInReleaseBuilds: true,
				},
				ios: {
					useFrameworks: 'static',
					forceStaticLinking: [
						'RNFBApp',
						'RNFBAnalytics',
						'RNFBCrashlytics',
						'RNFBMessaging',
						'RNFBRemoteConfig',
					],
					// NotificationService 타깃과 같은 pod 선언
					extraPods: [{ name: 'GoogleUtilities' }],
					enableSceneSupport: true,
				},
			},
		],
		[
			'expo-splash-screen',
			{
				backgroundColor: '#DB030F',
				image: './assets/images/splash-wordmark.png',
				imageWidth: 288,
				resizeMode: 'contain',
				dark: { backgroundColor: '#DB030F' },
			},
		],
		[
			'expo-font',
			{
				fonts: [
					'./assets/fonts/Pretendard-Regular.otf',
					'./assets/fonts/Pretendard-Medium.otf',
					'./assets/fonts/Pretendard-SemiBold.otf',
					'./assets/fonts/Pretendard-Bold.otf',
					'./assets/fonts/Pretendard-ExtraBold.otf',
					'./assets/fonts/Pretendard-Black.otf',
					'./assets/fonts/Fredoka-SemiBold.ttf',
				],
			},
		],
		'expo-localization',
		'expo-apple-authentication',
		'expo-secure-store',
		'expo-image-picker',
		'expo-video',
		'@config-plugins/react-native-webrtc',
		[
			'expo-audio',
			{
				microphonePermission: englishNative.ios.NSMicrophoneUsageDescription,
			},
		],
		['react-native-audio-api', { androidForegroundService: false }],
		[
			'expo-tracking-transparency',
			{
				userTrackingPermission: englishNative.ios.NSUserTrackingUsageDescription,
			},
		],
		'expo-asset',
		'expo-web-browser',
		'@bacons/apple-targets',
		[
			'@hot-updater/expo',
			{ channel: production ? 'production' : 'development', publicKeyPath: `./keys/${variant}/public-key.pem` },
		],
	],
	extra: {
		eas: { projectId: 'f00b95df-f52f-4021-8543-47971d4fa55e' },
		apiBaseUrl: String(process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim(),
		supabaseUrl: String(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim(),
		supabasePublishableKey: String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim(),
		clarityProjectId: String(process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID ?? '').trim() || 'wre3hgbj48',
		hotUpdaterApiKey: String(process.env.EXPO_PUBLIC_HOT_UPDATER_API_KEY ?? '').trim(),
		production,
	},
};

export default config;
