import { Platform } from 'react-native';

import i18next, { changeI18nLocale } from '@/i18n';

import { configureApi } from '@/lib/api';
import { takeRestoreErrors } from '@/lib/storage';

import NetInfo from '@react-native-community/netinfo';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { randomUUID } from 'expo-crypto';
import * as SplashScreen from 'expo-splash-screen';
import notifee, { AndroidImportance, AndroidStyle } from 'react-native-notify-kit';

import { accessToken, installUnauthorizedSignOut } from '@/services/auth/session';
import { loadLegacy } from '@/services/migration/upload-legacy';
import { getIsHeadless } from '@/services/push/background';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

/** 서버 요청의 X-Device-Id 헤더에 넣을 이 기기의 ID */
const deviceId = () => useAccountStore.getState().clientDeviceId ?? '';

/** 서버 요청의 Accept-Language 헤더에 넣을 앱 언어 */
const locale = () => useDeviceSettingsStore.getState().locale;

configureApi({ deviceId, locale, accessToken, reportError });

installUnauthorizedSignOut();

void SplashScreen.preventAutoHideAsync().catch((error) => reportError(error, 'splash_screen'));

const NOTIFICATION_CHANNEL_ID = 'default';
const LEGACY_FCM_CHANNEL_ID = 'fcm_fallback_notification_channel';
const LEGACY_EXPO_CHANNEL_ID = 'expo_notifications_fallback_notification_channel';

// Android는 앱이 앞에 떠 있을 때 받은 FCM 알림을 표시하지 않으므로 같은 내용의 로컬 알림으로 표시
if (Platform.OS === 'android') {
	onMessage(getMessaging(), (message) => {
		if (!message.notification) {
			return;
		}

		const imageUrl = message.notification.android?.imageUrl;

		void notifee
			.displayNotification({
				title: message.notification.title,
				body: message.notification.body,
				data: message.data,
				android: {
					channelId: NOTIFICATION_CHANNEL_ID,
					style: imageUrl ? { type: AndroidStyle.BIGPICTURE, picture: imageUrl } : undefined,
				},
			})
			.catch((error) => reportError(error, 'push_foreground'));
	});
}

// iOS 원격 알림 누름은 RNFirebase만 처리
void notifee
	.setNotificationConfig({ ios: { handleRemoteNotifications: false } })
	.catch((error) => reportError(error, 'push_config'));

// 첫 화면이 useTranslation을 호출하기 전에 i18next 초기화 시작
const i18nReady = changeI18nLocale(useDeviceSettingsStore.getState().locale);

/** 앱 시작 준비 함수 */
export const bootstrap = async () => {
	await i18nReady;

	// 기존 설정을 옮겨 알림 채널 생성
	if (Platform.OS === 'android') {
		try {
			const [fcmChannel, expoChannel] = await Promise.all([
				notifee.getChannel(LEGACY_FCM_CHANNEL_ID),
				notifee.getChannel(LEGACY_EXPO_CHANNEL_ID),
			]);

			const fcmImportance = fcmChannel?.importance ?? AndroidImportance.HIGH;
			const expoImportance = expoChannel?.importance ?? AndroidImportance.HIGH;

			await notifee.createChannel({
				id: NOTIFICATION_CHANNEL_ID,
				name: i18next.t('common.notificationChannelName'),
				// 사용자가 낮춘 중요도만 유지
				importance: Math.min(
					AndroidImportance.HIGH,
					fcmImportance < AndroidImportance.DEFAULT ? fcmImportance : AndroidImportance.HIGH,
					expoImportance,
				),
			});

			// 이전 expo 및 FCM 채널 삭제
			await notifee.deleteChannel(LEGACY_EXPO_CHANNEL_ID);
			await notifee.deleteChannel(LEGACY_FCM_CHANNEL_ID);
		} catch (e) {
			reportError(e, 'notification_channel');
		}
	}

	const restoreErrors = takeRestoreErrors();

	for (const { error, storeName } of restoreErrors) {
		reportError(error, `restore_${storeName}`);
	}

	const { clientDeviceId, setClientDeviceId } = useAccountStore.getState();

	if (!clientDeviceId) {
		setClientDeviceId(randomUUID());
	}

	if (await getIsHeadless()) {
		return 'headless' as const;
	}

	if ((await NetInfo.fetch()).isConnected === false) {
		return 'failed' as const;
	}

	try {
		await loadLegacy();
	} catch (e) {
		reportError(e, 'legacy_load');
	}

	return 'ready' as const;
};
