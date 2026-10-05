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

/** 언어별 네이티브 문구를 읽고 앱 이름 뒤에 빌드 구분을 붙이는 함수 */
const nativeLocale = (file: string) => {
	const { ios, android } = JSON.parse(readFileSync(path.join(__dirname, file), 'utf8')) as {
		ios: Record<string, string>;
		android: Record<string, string>;
	};

	return {
		ios: { ...ios, CFBundleDisplayName: `${ios.CFBundleDisplayName}${appNameSuffix}` },
		android: { ...android, app_name: `${android.app_name}${appNameSuffix}` },
	};
};

const config: ExpoConfig = {
	name: `BuddyBird${appNameSuffix}`,
	slug: 'buddybird',
	owner: 'joynnovate0410',
	version,
	orientation: 'default',
	scheme: production ? 'buddybird' : 'buddybird-dev',
	userInterfaceStyle: 'automatic',
	locales: { ko: nativeLocale('app/i18n/native/ko.json'), en: nativeLocale('app/i18n/native/en.json') },
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
			NSMicrophoneUsageDescription:
				'Microphone access lets you record words for your parrot and capture sounds during training.',
			NSPhotoLibraryUsageDescription: "Use a photo you choose as your parrot's profile picture.",
			NSCameraUsageDescription: 'Use the camera to take a profile photo of your parrot or yourself.',
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
	},
	plugins: [
		'./plugins/withAndroidBuildMemory',
		['@react-native-firebase/app', { ios: { disableSPM: true } }],
		'@react-native-firebase/crashlytics',
		[
			'@sentry/react-native/expo',
			{ url: 'https://sentry.io/', organization: 'joynnovate', project: 'buddybird-mobile', useNativeInit: true },
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
					forceStaticLinking: ['RNFBApp', 'RNFBAnalytics', 'RNFBCrashlytics', 'RNFBMessaging'],
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
		[
			'expo-audio',
			{
				microphonePermission:
					'Microphone access lets you record words for your parrot and capture sounds during training.',
			},
		],
		['react-native-audio-api', { androidForegroundService: false }],
		[
			'expo-tracking-transparency',
			{
				userTrackingPermission:
					'App usage statistics help us improve the learning experience. Training remains available if you decline tracking.',
			},
		],
		'expo-asset',
		'expo-web-browser',
		'@bacons/apple-targets',
	],
	extra: {
		eas: { projectId: 'f00b95df-f52f-4021-8543-47971d4fa55e' },
		apiBaseUrl: String(process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim(),
		supabaseUrl: String(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim(),
		supabasePublishableKey: String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim(),
		clarityProjectId: String(process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID ?? '').trim() || 'wre3hgbj48',
		production,
	},
};

export default config;
