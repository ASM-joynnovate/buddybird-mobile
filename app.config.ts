import { readFileSync } from "node:fs"
import path from "node:path"

import type { ExpoConfig } from "expo/config"

const { version } = JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf8")) as {
	version: string
}

const production = process.env.APP_VARIANT === "production"
const variant = production ? "prod" : "dev"
const id = production ? "com.joynnovate.buddybird" : "com.joynnovate.buddybird.dev"

const config: ExpoConfig = {
	name: production ? "버디버드" : "버디버드 (DEV)",
	slug: "buddybird",
	owner: "joynnovate0410",
	version,
	orientation: "portrait",
	scheme: production ? "buddybird" : "buddybird-dev",
	userInterfaceStyle: "automatic",
	locales: { ko: "./app/i18n/native/ko.json", en: "./app/i18n/native/en.json" },
	icon: "./assets/images/icon.png",
	ios: {
		bundleIdentifier: id,
		supportsTablet: true,
		googleServicesFile:
			process.env.GOOGLE_SERVICES_INFO_PLIST ??
			`./config/${variant}/firebase/GoogleService-Info.plist`,
		entitlements: { "aps-environment": production ? "production" : "development" },
		infoPlist: {
			CFBundleName: "BuddyBird",
			ITSAppUsesNonExemptEncryption: false,
			UIBackgroundModes: ["audio", "remote-notification"],
			NSMicrophoneUsageDescription: "단어를 녹음하고 학습 중 앵무새의 소리를 저장합니다.",
			NSPhotoLibraryUsageDescription: "앵무새 프로필에 사용할 사진을 선택합니다.",
			NSCameraUsageDescription: "앵무새 프로필 사진을 촬영합니다.",
		},
	},
	android: {
		package: id,
		googleServicesFile:
			process.env.GOOGLE_SERVICES_JSON ?? `./config/${variant}/firebase/google-services.json`,
		adaptiveIcon: {
			foregroundImage: "./assets/images/android-icon-foreground.png",
			backgroundColor: "#E0010E",
		},
		permissions: [
			"RECORD_AUDIO",
			"MODIFY_AUDIO_SETTINGS",
			"POST_NOTIFICATIONS",
			"FOREGROUND_SERVICE",
			"FOREGROUND_SERVICE_MICROPHONE",
			"FOREGROUND_SERVICE_MEDIA_PLAYBACK",
			"com.google.android.gms.permission.AD_ID",
		],
	},
	plugins: [
		"./plugins/withSessionAudioEngine",
		"./plugins/withAndroidBuildMemory",
		"@react-native-firebase/app",
		"@react-native-firebase/auth",
		"@react-native-firebase/crashlytics",
		[
			"expo-build-properties",
			{
				ios: {
					useFrameworks: "static",
					forceStaticLinking: [
						"RNFBApp",
						"RNFBAuth",
						"RNFBAnalytics",
						"RNFBCrashlytics",
						"RNFBFirestore",
						"RNFBMessaging",
						"RNFBRemoteConfig",
					],
				},
			},
		],
		[
			"expo-splash-screen",
			{
				backgroundColor: "#DB030F",
				image: "./assets/images/splash-wordmark.png",
				imageWidth: 288,
				resizeMode: "contain",
				dark: { backgroundColor: "#DB030F" },
			},
		],
		[
			"expo-font",
			{
				fonts: [
					"./assets/fonts/Pretendard-Regular.otf",
					"./assets/fonts/Pretendard-Bold.otf",
					"./assets/fonts/Pretendard-ExtraBold.otf",
					"./assets/fonts/Pretendard-Black.otf",
					"./assets/fonts/Nunito-Bold.ttf",
					"./assets/fonts/Nunito-ExtraBold.ttf",
					"./assets/fonts/Nunito-Black.ttf",
					"./assets/fonts/Fredoka-SemiBold.ttf",
				],
			},
		],
		"expo-localization",
		"expo-image-picker",
		[
			"expo-audio",
			{ microphonePermission: "단어를 녹음하고 학습 중 앵무새의 소리를 저장합니다." },
		],
		[
			"expo-tracking-transparency",
			{ userTrackingPermission: "앱 이용 정보를 분석하여 학습 경험을 개선합니다." },
		],
	],
	extra: {
		eas: { projectId: "f00b95df-f52f-4021-8543-47971d4fa55e" },
		apiBaseUrl: String(process.env.EXPO_PUBLIC_API_BASE_URL ?? "").trim(),
		clarityProjectId:
			String(process.env.EXPO_PUBLIC_CLARITY_PROJECT_ID ?? "").trim() || "wre3hgbj48",
		production,
	},
}

export default config
