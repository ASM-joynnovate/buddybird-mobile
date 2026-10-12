import { useMemo, useRef } from 'react';

import { pushDataSchema } from '@/types/apis/notifications';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { useReadNotification } from '@/hooks/apis/notifications';
import useEntryRoute, { type EntryRoute } from '@/hooks/use-entry-route';

import { getInitialNotification, getMessaging, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import {
	type LinkingOptions,
	NavigationContainer,
	type PathConfig,
	type RouteProp,
	useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';

import { env } from '@/config';
import MainTabs from '@/navigators/main-tabs';
import AnnouncementDetailScreen from '@/screens/home/announcement-detail-screen';
import NotificationDetailScreen from '@/screens/home/notification-detail-screen';
import ConsentDetailScreen from '@/screens/onboarding/consent-detail-screen';
import ConsentScreen from '@/screens/onboarding/consent-screen';
import LegacyUploadScreen from '@/screens/onboarding/legacy-upload-screen';
import LoginScreen from '@/screens/onboarding/login-screen';
import MarketingNotificationScreen from '@/screens/onboarding/marketing-notification-screen';
import ParrotEditorScreen from '@/screens/onboarding/parrot-editor-screen';
import PermissionRequestScreen from '@/screens/onboarding/permission-request-screen';
import UsageGuideScreen from '@/screens/onboarding/usage-guide-screen';
import SessionRunScreen from '@/screens/session/session-run-screen';
import SessionSummaryScreen from '@/screens/session/session-summary-screen';
import ConsentSettingsScreen from '@/screens/settings/consent-settings-screen';
import DevicesScreen from '@/screens/settings/devices-screen';
import NotificationSettingsScreen from '@/screens/settings/notification-settings-screen';
import SettingsScreen from '@/screens/settings/settings-screen';
import RecordingGuideScreen from '@/screens/words/recording-guide-screen';
import { navigationIntegration, reportError, track, trackScreen } from '@/services/telemetry/client';
import { colors } from '@/theme';
import { notificationPath } from '@/utils/notification';

import OfflineBanner from '@/components/offline-banner';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * 앵무새 카드에서 연 수정 화면은 투명 모달로 띄워 사진이 옮겨 가는 동안 뒤의 프로필이 보이게 함
 * @param route 앵무새 수정 화면 route
 */
const parrotEditorOptions = ({
	route,
}: {
	route: RouteProp<RootStackParamList, 'ParrotEditor'>;
}): NativeStackNavigationOptions => {
	if (!route.params?.photoOrigin) {
		return {};
	}

	return {
		presentation: 'containedTransparentModal',
		animation: 'none',
		contentStyle: { backgroundColor: colors.backgroundTransparent },
	};
};

/** 실행 환경에 맞는 앱 링크 prefix */
const linkPrefix = () => {
	return `${env.isProduction ? 'buddybird' : 'buddybird-dev'}://`;
};

const reportTabLinking: PathConfig<ReportStackParamList> = {
	initialRouteName: 'Report',
	screens: { SessionDetail: 'sessions/:sessionId' },
};

const ONBOARDING_ORDER = ['ParrotEditor', 'UsageGuide'] as const;

/** 현재 온보딩 화면까지 쌓은 navigation 상태 생성 함수 */
const entryState = (route: (typeof ONBOARDING_ORDER)[number], parrotId?: string) => {
	const routes = ONBOARDING_ORDER.slice(0, ONBOARDING_ORDER.indexOf(route) + 1).map((name) =>
		name === 'ParrotEditor'
			? {
					name,
					params: {
						parrotId: route === 'UsageGuide' ? parrotId : undefined,
						source: 'onboarding',
					},
				}
			: { name },
	);

	return { index: routes.length - 1, routes };
};

/** 첫 화면에 맞는 navigation 초기 상태 생성 함수 */
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

	return entryState(route, parrotId);
};

/** 앱 navigator 컴포넌트 */
const AppNavigator = () => {
	const navigationRef = useNavigationContainerRef<RootStackParamList>();

	const screenNameRef = useRef<string | null>(null);

	const { entryRoute, parrotId } = useEntryRoute();

	const { mutate: readNotification } = useReadNotification();

	const linking = useMemo<LinkingOptions<RootStackParamList>>(() => {
		/** 푸시를 읽음으로 바꾸고 열 화면의 앱 링크 주소를 만드는 함수 */
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

			return path ? `${linkPrefix()}${path.slice(1)}` : null;
		};

		return {
			prefixes: [linkPrefix()],
			config: {
				initialRouteName: 'Main',
				screens: {
					Main: { screens: { ReportTab: reportTabLinking } },
					AnnouncementDetail: 'announcements/:announcementId',
					NotificationDetail: 'notifications/:notificationId',
					NotificationSettings: 'settings/notifications',
				},
			},
			getInitialURL: async () => {
				try {
					const message = await getInitialNotification(getMessaging());

					if (message) {
						return resolvePushUrl(message.data);
					}

					const response = Notifications.getLastNotificationResponse();
					const trigger = response?.notification.request.trigger;

					if (!response || (trigger && 'type' in trigger && trigger.type === 'push')) {
						return null;
					}

					Notifications.clearLastNotificationResponse();

					return resolvePushUrl(response.notification.request.content.data);
				} catch (e) {
					reportError(e, 'push_initial');

					return null;
				}
			},
			subscribe: (listener) => {
				/** 학습 화면이 아닐 때만 푸시가 가리키는 화면으로 이동하는 함수 */
				const openPush = (pushData: unknown) => {
					const url = resolvePushUrl(pushData);

					if (url && navigationRef.getCurrentRoute()?.name !== 'SessionRun') {
						listener(url);
					}
				};

				const unsubscribeOpenedApp = onNotificationOpenedApp(getMessaging(), (message) =>
					openPush(message.data),
				);
				const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
					const { trigger } = response.notification.request;

					if (!(trigger && 'type' in trigger && trigger.type === 'push')) {
						Notifications.clearLastNotificationResponse();

						openPush(response.notification.request.content.data);
					}
				});

				return () => {
					unsubscribeOpenedApp();
					responseSubscription.remove();
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
				onReady={() => {
					navigationIntegration.registerNavigationContainer(navigationRef);
					handleTrackScreen();
				}}
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
							<RootStack.Screen name="UsageGuide" component={UsageGuideScreen} />
							<RootStack.Screen name="PermissionRequest" component={PermissionRequestScreen} />
							<RootStack.Screen name="MarketingNotification" component={MarketingNotificationScreen} />
						</RootStack.Group>
					)}

					{/*메인 화면*/}
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

							<RootStack.Screen name="RecordingGuide" component={RecordingGuideScreen} />

							<RootStack.Screen name="Settings" component={SettingsScreen} />
							<RootStack.Screen name="ConsentSettings" component={ConsentSettingsScreen} />
							<RootStack.Screen name="Devices" component={DevicesScreen} />
							<RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
						</RootStack.Group>
					)}
				</RootStack.Navigator>
			</NavigationContainer>
		</OfflineBanner>
	);
};

export default AppNavigator;
