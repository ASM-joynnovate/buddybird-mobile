import { useRef } from 'react';

import { pushDataSchema } from '@/types/apis/notifications';

import type { RootStackParamList } from '@/types/navigation';

import { type EntryRoute, useEntryRoute } from '@/hooks/use-entry-route';

import { getInitialNotification, getMessaging, onNotificationOpenedApp } from '@react-native-firebase/messaging';
import {
	type LinkingOptions,
	NavigationContainer,
	type NavigationState,
	type PartialState,
	useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { env } from '@/config';
import { MainTabs } from '@/navigators/main-tabs';
import { ConsentDetailScreen } from '@/screens/entry/consent-detail-screen';
import { ConsentScreen } from '@/screens/entry/consent-screen';
import { LegacyUploadScreen } from '@/screens/entry/legacy-upload-screen';
import { LoginScreen } from '@/screens/entry/login-screen';
import { ParrotEditorScreen } from '@/screens/entry/parrot-editor-screen';
import { PermissionRequestScreen } from '@/screens/entry/permission-request-screen';
import { UsageGuideScreen } from '@/screens/entry/usage-guide-screen';
import { NoticeDetailScreen } from '@/screens/home/notice-detail-screen';
import { SessionRunScreen } from '@/screens/session/session-run-screen';
import { SessionSummaryScreen } from '@/screens/session/session-summary-screen';
import { ConsentSettingsScreen } from '@/screens/settings/consent-settings-screen';
import { DevicesScreen } from '@/screens/settings/devices-screen';
import { NoticeListScreen } from '@/screens/settings/notice-list-screen';
import { PermissionsScreen } from '@/screens/settings/permissions-screen';
import { SettingsScreen } from '@/screens/settings/settings-screen';
import { RecorderScreen } from '@/screens/words/recorder-screen';
import { RecordingGuideScreen } from '@/screens/words/recording-guide-screen';
import { reportError, screen, track } from '@/services/telemetry/client';
import { colors } from '@/theme';
import { notificationPath } from '@/utils/notification';

import { StartupScreen } from '@/components/app/startup-screen';
import { OfflineBanner } from '@/components/offline-banner';

const Stack = createNativeStackNavigator<RootStackParamList>();

function linkPrefix() {
	return `${env.production ? 'buddybird' : 'buddybird-dev'}://`;
}

function openPush(data: unknown): string | null {
	const parsed = pushDataSchema.safeParse(data);

	if (!parsed.success) {
		reportError(parsed.error, 'push_opened');

		return null;
	}

	track('notification_opened', { kind: parsed.data.kind, from: 'push' });

	return `${linkPrefix()}${notificationPath(parsed.data).slice(1)}`;
}

const linking: LinkingOptions<RootStackParamList> = {
	prefixes: [linkPrefix()],
	config: {
		screens: {
			Main: { screens: { ReportTab: { screens: { Report: 'report' } } } },
		},
	},
	async getInitialURL() {
		try {
			const message = await getInitialNotification(getMessaging());

			return message ? openPush(message.data) : null;
		} catch (error) {
			reportError(error, 'push_initial');

			return null;
		}
	},
	subscribe(listener) {
		return onNotificationOpenedApp(getMessaging(), (message) => {
			const url = openPush(message.data);

			if (url) {
				listener(url);
			}
		});
	},
};

const ENTRY_ORDER = ['Consent', 'ParrotEditor', 'UsageGuide'] as const;

function entryState(route: (typeof ENTRY_ORDER)[number], parrotId?: string): PartialState<NavigationState> {
	const routes = ENTRY_ORDER.slice(0, ENTRY_ORDER.indexOf(route) + 1).map((name) =>
		name === 'ParrotEditor'
			? {
					name,
					params: {
						parrotId: route === 'UsageGuide' ? parrotId : undefined,
						source: 'entry',
					},
				}
			: { name },
	);

	return { index: routes.length - 1, routes };
}

function initialStateOf(
	route: Exclude<EntryRoute, 'loading' | 'error' | 'LegacyUpload'>,
	parrotId?: string,
): PartialState<NavigationState> | undefined {
	if (route === 'Main') {
		return undefined;
	}

	if (route === 'Login') {
		return { index: 0, routes: [{ name: 'Login', params: { source: 'entry' } }] };
	}

	return entryState(route, parrotId);
}

export function AppNavigator() {
	const { route, parrotId, retry } = useEntryRoute();

	const navigationRef = useNavigationContainerRef<RootStackParamList>();
	const screenName = useRef<string | null>(null);

	function recordScreen() {
		const current = navigationRef.getCurrentRoute()?.name ?? null;

		if (current && current !== screenName.current) {
			screen(current);
		}

		screenName.current = current;
	}

	if (route === 'loading' || route === 'error') {
		return <StartupScreen startupFailed={route === 'error'} onRetry={retry} />;
	}

	if (route === 'LegacyUpload') {
		return <LegacyUploadScreen />;
	}

	return (
		<>
			<NavigationContainer
				key={route}
				ref={navigationRef}
				initialState={initialStateOf(route, parrotId)}
				linking={route === 'Main' ? linking : undefined}
				onReady={recordScreen}
				onStateChange={recordScreen}
			>
				<Stack.Navigator
					screenOptions={{
						headerShown: false,
						orientation: 'portrait',
						contentStyle: { backgroundColor: colors.background },
					}}
				>
					{route === 'Main' ? null : (
						<Stack.Group>
							<Stack.Screen name="Login" component={LoginScreen} />
							<Stack.Screen name="Consent" component={ConsentScreen} />
							<Stack.Screen name="ConsentDetail" component={ConsentDetailScreen} />
							<Stack.Screen name="ParrotEditor" component={ParrotEditorScreen} />
							<Stack.Screen name="UsageGuide" component={UsageGuideScreen} />
							<Stack.Screen name="PermissionRequest" component={PermissionRequestScreen} />
						</Stack.Group>
					)}
					{route === 'Main' ? (
						<Stack.Group>
							<Stack.Screen name="Main" component={MainTabs} />
							<Stack.Screen name="Login" component={LoginScreen} />
							<Stack.Screen name="ParrotEditor" component={ParrotEditorScreen} />
							<Stack.Screen name="ConsentDetail" component={ConsentDetailScreen} />
							<Stack.Screen name="NoticeDetail" component={NoticeDetailScreen} />
							<Stack.Screen
								name="SessionRun"
								component={SessionRunScreen}
								options={{
									animation: 'fade',
									gestureEnabled: false,
									orientation: 'default',
								}}
							/>
							<Stack.Screen
								name="SessionSummary"
								component={SessionSummaryScreen}
								options={{
									animation: 'fade',
									gestureEnabled: false,
									orientation: 'default',
								}}
							/>
							<Stack.Screen name="RecordingGuide" component={RecordingGuideScreen} />
							<Stack.Screen
								name="Recorder"
								component={RecorderScreen}
								options={{ presentation: 'fullScreenModal' }}
							/>
							<Stack.Screen name="Settings" component={SettingsScreen} />
							<Stack.Screen name="NoticeList" component={NoticeListScreen} />
							<Stack.Screen name="ConsentSettings" component={ConsentSettingsScreen} />
							<Stack.Screen name="Devices" component={DevicesScreen} />
							<Stack.Screen name="Permissions" component={PermissionsScreen} />
						</Stack.Group>
					) : null}
				</Stack.Navigator>
			</NavigationContainer>
			<OfflineBanner />
		</>
	);
}
