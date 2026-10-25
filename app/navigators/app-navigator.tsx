import { useMemo, useRef } from 'react';

import { AppState, Platform } from 'react-native';

import { pushDataSchema } from '@/types/apis/notifications';

import type { EntryRoute, RootStackParamList } from '@/types/navigation';

import { useReadNotification } from '@/hooks/apis/notifications';
import useEntryRoute from '@/hooks/use-entry-route';

import { getInitialNotification, getMessaging, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import {
	type LinkingOptions,
	NavigationContainer,
	type RouteProp,
	useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import notifee, { EventType } from 'react-native-notify-kit';

import { env } from '@/config/env';
import MainTabs from '@/navigators/main-tabs';
import LoginScreen from '@/screens/auth/login-screen';
import ConsentDetailScreen from '@/screens/consent/consent-detail-screen';
import ConsentScreen from '@/screens/consent/consent-screen';
import AnnouncementDetailScreen from '@/screens/home/announcement-detail-screen';
import NotificationDetailScreen from '@/screens/home/notification-detail-screen';
import LegacyUploadScreen from '@/screens/onboarding/legacy-upload-screen';
import MarketingNotificationScreen from '@/screens/onboarding/marketing-notification-screen';
import PermissionRequestScreen from '@/screens/onboarding/permission-request-screen';
import ParrotEditorScreen from '@/screens/parrot/parrot-editor-screen';
import SessionRunScreen from '@/screens/session/session-run-screen';
import SessionSummaryScreen from '@/screens/session/session-summary-screen';
import SessionWatchScreen from '@/screens/session/session-watch-screen';
import ConsentSettingsScreen from '@/screens/settings/consent-settings-screen';
import DevicesScreen from '@/screens/settings/devices-screen';
import NotificationGroupSettingsScreen from '@/screens/settings/notification-group-settings-screen';
import NotificationSettingsScreen from '@/screens/settings/notification-settings-screen';
import SettingsScreen from '@/screens/settings/settings-screen';
import RecordingGuideScreen from '@/screens/words/recording-guide-screen';
import { navigationIntegration, reportError, track, trackScreen } from '@/services/telemetry/client';
import { colors } from '@/theme';
import { linkingConfig } from '@/utils/linking';
import { notificationPath } from '@/utils/notification';

import OfflineBanner from '@/components/offline-banner';

const RootStack = createNativeStackNavigator<RootStackParamList>();

interface ParrotEditorOptionsParams {
	route: RouteProp<RootStackParamList, 'ParrotEditor'>;
}

/**
 * 카드에서 이동한 수정 화면은 투명 모달로 표시
 * @param route 앵무새 수정 화면 route
 */
const parrotEditorOptions = ({ route }: ParrotEditorOptionsParams): NativeStackNavigationOptions => {
	if (!route.params?.photoOrigin) {
		return {};
	}

	return {
		presentation: 'containedTransparentModal',
		animation: 'none',
		contentStyle: { backgroundColor: colors.backgroundTransparent },
	};
};

const linkPrefix = `${env.appScheme}://`;

/** navigation 초기 상태 생성 함수 */
const initialStateOf = (route: Exclude<EntryRoute, 'LegacyUpload'>, parrotId?: string) => {
	if (route === 'Main') {
		return undefined;
	}

	if (route === 'Login') {
		return { index: 0, routes: [{ name: 'Login', params: { source: 'onboarding' } }] };
	}

	if (route === 'Consent') {
		return { index: 0, routes: [{ name: 'Consent' }] };
	}

	if (route === 'ParrotEditor') {
		return { index: 0, routes: [{ name: 'ParrotEditor', params: { source: 'onboarding' } }] };
	}

	return {
		index: 1,
		routes: [{ name: 'ParrotEditor', params: { parrotId, source: 'onboarding' } }, { name: 'PermissionRequest' }],
	};
};

/** 앱 navigator 컴포넌트 */
const AppNavigator = () => {
	const navigationRef = useNavigationContainerRef<RootStackParamList>();

	const screenNameRef = useRef<string | null>(null);

	const { mutate: readNotification } = useReadNotification();

	const { entryRoute, parrotId } = useEntryRoute();

	const linking = useMemo<LinkingOptions<RootStackParamList>>(() => {
		/** 푸시를 읽음 처리하고 앱 링크를 반환하는 함수 */
		const resolvePushUrl = (pushData: unknown) => {
			const parsed = pushDataSchema.safeParse(pushData);

			if (!parsed.success) {
				reportError(parsed.error, 'push_opened');

				return null;
			}

			track('notification_opened', { kind: parsed.data.kind, from: 'push' });

			if (parsed.data.notification_id) {
				readNotification({ id: parsed.data.notification_id });
			}

			const path = notificationPath(parsed.data);

			return path ? `${linkPrefix}${path.slice(1)}` : null;
		};

		return {
			prefixes: [linkPrefix],
			config: linkingConfig,
			getInitialURL: async () => {
				try {
					const message = await getInitialNotification(getMessaging());

					if (message) {
						return resolvePushUrl(message.data);
					}

					if (Platform.OS !== 'android') {
						return null;
					}

					const initialNotification = await notifee.getInitialNotification();

					return initialNotification ? resolvePushUrl(initialNotification.notification.data) : null;
				} catch (e) {
					reportError(e, 'push_initial');

					return null;
				}
			},
			subscribe: (listener) => {
				/** 푸시가 가리키는 화면으로 이동하는 함수 */
				const openPush = (pushData: unknown) => {
					const url = resolvePushUrl(pushData);

					if (url && navigationRef.getCurrentRoute()?.name !== 'SessionRun') {
						listener(url);
					}
				};

				const unsubscribeOpenedApp = onNotificationOpenedApp(getMessaging(), (message) =>
					openPush(message.data),
				);

				if (Platform.OS !== 'android') {
					return unsubscribeOpenedApp;
				}

				/** 누른 알림의 화면으로 이동하는 함수 */
				const openPressedNotification = () => {
					void notifee
						.getInitialNotification()
						.then((initialNotification) => {
							if (initialNotification) {
								openPush(initialNotification.notification.data);
							}
						})
						.catch((error: unknown) => reportError(error, 'push_pressed'));
				};

				// 포그라운드 알림 누름
				const unsubscribeForeground = notifee.onForegroundEvent(({ type }) => {
					if (type === EventType.PRESS) {
						openPressedNotification();
					}
				});

				// 백그라운드에서 누르고 돌아옴
				const appStateSubscription = AppState.addEventListener('change', (appState) => {
					if (appState === 'active') {
						openPressedNotification();
					}
				});

				return () => {
					unsubscribeOpenedApp();
					unsubscribeForeground();
					appStateSubscription.remove();
				};
			},
		};
	}, [navigationRef, readNotification]);

	const handleTrackScreen = () => {
		const currentScreenName = navigationRef.getCurrentRoute()?.name ?? null;

		if (currentScreenName && currentScreenName !== screenNameRef.current) {
			trackScreen(currentScreenName);
		}

		screenNameRef.current = currentScreenName;
	};

	const handleReady = () => {
		navigationIntegration.registerNavigationContainer(navigationRef);

		handleTrackScreen();
	};

	if (entryRoute === 'LegacyUpload') {
		return <LegacyUploadScreen />;
	}

	return (
		<OfflineBanner>
			<NavigationContainer
				key={entryRoute}
				ref={navigationRef}
				initialState={initialStateOf(entryRoute, parrotId)}
				linking={entryRoute === 'Main' ? linking : undefined}
				onReady={handleReady}
				onStateChange={handleTrackScreen}
			>
				<RootStack.Navigator
					screenOptions={{
						headerShown: false,
						orientation: 'portrait',
						contentStyle: { backgroundColor: colors.background },
					}}
				>
					{/*온보딩 화면*/}
					{entryRoute !== 'Main' && (
						<RootStack.Group>
							<RootStack.Screen name="Login" component={LoginScreen} />
							<RootStack.Screen name="Consent" component={ConsentScreen} />
							<RootStack.Screen name="ConsentDetail" component={ConsentDetailScreen} />
							<RootStack.Screen name="ParrotEditor" component={ParrotEditorScreen} />
							<RootStack.Screen name="PermissionRequest" component={PermissionRequestScreen} />
							<RootStack.Screen name="MarketingNotification" component={MarketingNotificationScreen} />
						</RootStack.Group>
					)}

					{entryRoute === 'Main' && (
						<RootStack.Group>
							<RootStack.Screen name="Main" component={MainTabs} />
							<RootStack.Screen name="Login" component={LoginScreen} />
							<RootStack.Screen
								name="ParrotEditor"
								component={ParrotEditorScreen}
								options={parrotEditorOptions}
							/>
							<RootStack.Screen name="ConsentDetail" component={ConsentDetailScreen} />
							<RootStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
							<RootStack.Screen name="NotificationDetail" component={NotificationDetailScreen} />

							<RootStack.Screen
								name="SessionRun"
								component={SessionRunScreen}
								options={{
									animation: 'fade',
									gestureEnabled: false,
									orientation: 'default',
								}}
							/>
							<RootStack.Screen
								name="SessionSummary"
								component={SessionSummaryScreen}
								options={{
									animation: 'fade',
									gestureEnabled: false,
									orientation: 'default',
								}}
							/>

							<RootStack.Screen
								name="SessionWatch"
								component={SessionWatchScreen}
								options={{ animation: 'fade', orientation: 'default' }}
							/>

							<RootStack.Screen name="RecordingGuide" component={RecordingGuideScreen} />

							<RootStack.Screen name="Settings" component={SettingsScreen} />
							<RootStack.Screen name="ConsentSettings" component={ConsentSettingsScreen} />
							<RootStack.Screen name="Devices" component={DevicesScreen} />
							<RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
							<RootStack.Screen
								name="NotificationGroupSettings"
								component={NotificationGroupSettingsScreen}
							/>
						</RootStack.Group>
					)}
				</RootStack.Navigator>
			</NavigationContainer>
		</OfflineBanner>
	);
};

export default AppNavigator;
