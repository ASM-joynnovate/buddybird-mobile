import { useRef } from 'react';

import { pushDataSchema } from '@/types/apis/notifications';

import type { RootStackParamList } from '@/types/navigation';

import useEntryRoute, { type EntryRoute } from '@/hooks/use-entry-route';

import { getInitialNotification, getMessaging, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import {
	type LinkingOptions,
	NavigationContainer,
	useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { env } from '@/config';
import MainTabs from '@/navigators/main-tabs';
import NoticeDetailScreen from '@/screens/home/notice-detail-screen';
import ConsentDetailScreen from '@/screens/onboarding/consent-detail-screen';
import ConsentScreen from '@/screens/onboarding/consent-screen';
import LegacyUploadScreen from '@/screens/onboarding/legacy-upload-screen';
import LoginScreen from '@/screens/onboarding/login-screen';
import ParrotEditorScreen from '@/screens/onboarding/parrot-editor-screen';
import PermissionRequestScreen from '@/screens/onboarding/permission-request-screen';
import UsageGuideScreen from '@/screens/onboarding/usage-guide-screen';
import SessionRunScreen from '@/screens/session/session-run-screen';
import SessionSummaryScreen from '@/screens/session/session-summary-screen';
import ConsentSettingsScreen from '@/screens/settings/consent-settings-screen';
import DevicesScreen from '@/screens/settings/devices-screen';
import NoticeListScreen from '@/screens/settings/notice-list-screen';
import NotificationSettingsScreen from '@/screens/settings/notification-settings-screen';
import SettingsScreen from '@/screens/settings/settings-screen';
import RecordingGuideScreen from '@/screens/words/recording-guide-screen';
import { reportError, track, trackScreen } from '@/services/telemetry/client';
import { colors } from '@/theme';
import { notificationPath } from '@/utils/notification';

import OfflineBanner from '@/components/offline-banner';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/** 실행 환경에 맞는 앱 링크 prefix */
const linkPrefix = () => {
	return `${env.isProduction ? 'buddybird' : 'buddybird-dev'}://`;
};

/** 푸시 알림으로 열 화면의 앱 링크 주소를 만드는 함수 */
const resolvePushUrl = (pushData: unknown) => {
	const parsed = pushDataSchema.safeParse(pushData);

	if (!parsed.success) {
		reportError(parsed.error, 'push_opened');

		return null;
	}

	track('notification_opened', { kind: parsed.data.kind, from: 'push' });

	return `${linkPrefix()}${notificationPath(parsed.data).slice(1)}`;
};

const linking: LinkingOptions<RootStackParamList> = {
	prefixes: [linkPrefix()],
	config: {
		screens: {
			Main: { screens: { ReportTab: { screens: { Report: 'report' } } } },
		},
	},
	getInitialURL: async () => {
		try {
			const message = await getInitialNotification(getMessaging());

			return message ? resolvePushUrl(message.data) : null;
		} catch (e) {
			reportError(e, 'push_initial');

			return null;
		}
	},
	subscribe: (listener) => {
		return onNotificationOpenedApp(getMessaging(), (message) => {
			const url = resolvePushUrl(message.data);

			if (url) {
				listener(url);
			}
		});
	},
};

const ONBOARDING_ORDER = ['Consent', 'ParrotEditor', 'UsageGuide'] as const;

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

	return entryState(route, parrotId);
};

/** 앱 navigator 컴포넌트 */
const AppNavigator = () => {
	const navigationRef = useNavigationContainerRef<RootStackParamList>();

	const screenNameRef = useRef<string | null>(null);

	const { entryRoute, parrotId } = useEntryRoute();

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
		<>
			<NavigationContainer
				key={entryRoute}
				ref={navigationRef}
				initialState={initialStateOf(entryRoute, parrotId)}
				linking={entryRoute === 'Main' ? linking : undefined}
				onReady={handleTrackScreen}
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
							/>
							<RootStack.Screen name="ConsentDetail" component={ConsentDetailScreen} />
							<RootStack.Screen name="NoticeDetail" component={NoticeDetailScreen} />

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
							<RootStack.Screen name="NoticeList" component={NoticeListScreen} />
							<RootStack.Screen name="ConsentSettings" component={ConsentSettingsScreen} />
							<RootStack.Screen name="Devices" component={DevicesScreen} />
							<RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
						</RootStack.Group>
					)}
				</RootStack.Navigator>
			</NavigationContainer>

			<OfflineBanner />
		</>
	);
};

export default AppNavigator;
