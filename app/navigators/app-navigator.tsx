import {
	getInitialNotification,
	getMessaging,
	onNotificationOpenedApp,
} from "@react-native-firebase/messaging"
import {
	type LinkingOptions,
	NavigationContainer,
	type NavigationState,
	type PartialState,
	useNavigationContainerRef,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useRef } from "react"

import { StartupScreen } from "@/components/app/startup-screen"
import { OfflineBanner } from "@/components/offline-banner"
import { env } from "@/config"
import { type EntryRoute, useEntryRoute } from "@/hooks/use-entry-route"
import { MainTabs } from "@/navigators/main-tabs"
import { ConsentDetailScreen } from "@/screens/Entry/ConsentDetailScreen"
import { ConsentScreen } from "@/screens/Entry/ConsentScreen"
import { LegacyUploadScreen } from "@/screens/Entry/LegacyUploadScreen"
import { LoginScreen } from "@/screens/Entry/LoginScreen"
import { ParrotEditorScreen } from "@/screens/Entry/ParrotEditorScreen"
import { PermissionRequestScreen } from "@/screens/Entry/PermissionRequestScreen"
import { UsageGuideScreen } from "@/screens/Entry/UsageGuideScreen"
import { NoticeDetailScreen } from "@/screens/Home/NoticeDetailScreen"
import { SessionRunScreen } from "@/screens/Session/SessionRunScreen"
import { SessionSummaryScreen } from "@/screens/Session/SessionSummaryScreen"
import { ConsentSettingsScreen } from "@/screens/Settings/ConsentSettingsScreen"
import { DevicesScreen } from "@/screens/Settings/DevicesScreen"
import { NoticeListScreen } from "@/screens/Settings/NoticeListScreen"
import { PermissionsScreen } from "@/screens/Settings/PermissionsScreen"
import { SettingsScreen } from "@/screens/Settings/SettingsScreen"
import { RecorderScreen } from "@/screens/Words/RecorderScreen"
import { RecordingGuideScreen } from "@/screens/Words/RecordingGuideScreen"
import { reportError, screen, track } from "@/services/telemetry/client"
import { colors } from "@/theme"
import { pushDataSchema } from "@/types/apis/notifications"
import type { RootStackParamList } from "@/types/navigation"
import { notificationPath } from "@/utils/notification"

const Stack = createNativeStackNavigator<RootStackParamList>()

function linkPrefix() {
	return `${env.production ? "buddybird" : "buddybird-dev"}://`
}

function openPush(data: unknown): string | null {
	const parsed = pushDataSchema.safeParse(data)

	if (!parsed.success) {
		reportError(parsed.error, "push_opened")

		return null
	}

	track("notification_opened", { kind: parsed.data.kind, from: "push" })

	return `${linkPrefix()}${notificationPath(parsed.data).slice(1)}`
}

const linking: LinkingOptions<RootStackParamList> = {
	prefixes: [linkPrefix()],
	config: {
		screens: {
			Main: { screens: { ReportTab: { screens: { Report: "report" } } } },
		},
	},
	async getInitialURL() {
		try {
			const message = await getInitialNotification(getMessaging())

			return message ? openPush(message.data) : null
		} catch (error) {
			reportError(error, "push_initial")

			return null
		}
	},
	subscribe(listener) {
		return onNotificationOpenedApp(getMessaging(), (message) => {
			const url = openPush(message.data)

			if (url) {
				listener(url)
			}
		})
	},
}

const ENTRY_ORDER = ["Consent", "ParrotEditor", "UsageGuide"] as const

function entryState(
	route: (typeof ENTRY_ORDER)[number],
	parrotId?: string,
): PartialState<NavigationState> {
	const routes = ENTRY_ORDER.slice(0, ENTRY_ORDER.indexOf(route) + 1).map((name) =>
		name === "ParrotEditor"
			? {
					name,
					params: {
						parrotId: route === "UsageGuide" ? parrotId : undefined,
						source: "entry",
					},
				}
			: { name },
	)

	return { index: routes.length - 1, routes }
}

function initialStateOf(
	route: Exclude<EntryRoute, "loading" | "error" | "LegacyUpload">,
	parrotId?: string,
): PartialState<NavigationState> | undefined {
	if (route === "Main") {
		return undefined
	}

	if (route === "Login") {
		return { index: 0, routes: [{ name: "Login", params: { source: "entry" } }] }
	}

	return entryState(route, parrotId)
}

export function AppNavigator() {
	const { route, parrotId, retry } = useEntryRoute()

	const navigationRef = useNavigationContainerRef<RootStackParamList>()
	const screenName = useRef<string | null>(null)

	function recordScreen() {
		const current = navigationRef.getCurrentRoute()?.name ?? null

		if (current && current !== screenName.current) {
			screen(current)
		}

		screenName.current = current
	}

	if (route === "loading" || route === "error") {
		return <StartupScreen failed={route === "error"} onRetry={retry} />
	}

	if (route === "LegacyUpload") {
		return <LegacyUploadScreen />
	}

	return (
		<>
			<NavigationContainer
				key={route}
				ref={navigationRef}
				initialState={initialStateOf(route, parrotId)}
				linking={route === "Main" ? linking : undefined}
				onReady={recordScreen}
				onStateChange={recordScreen}
			>
				<Stack.Navigator
					screenOptions={{
						headerShown: false,
						orientation: "portrait",
						contentStyle: { backgroundColor: colors.background },
					}}
				>
					{route === "Main" ? null : (
						<Stack.Group>
							<Stack.Screen name="Login" component={LoginScreen} />
							<Stack.Screen name="Consent" component={ConsentScreen} />
							<Stack.Screen name="ConsentDetail" component={ConsentDetailScreen} />
							<Stack.Screen name="ParrotEditor" component={ParrotEditorScreen} />
							<Stack.Screen name="UsageGuide" component={UsageGuideScreen} />
							<Stack.Screen
								name="PermissionRequest"
								component={PermissionRequestScreen}
							/>
						</Stack.Group>
					)}
					{route === "Main" ? (
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
									animation: "fade",
									gestureEnabled: false,
									orientation: "default",
								}}
							/>
							<Stack.Screen
								name="SessionSummary"
								component={SessionSummaryScreen}
								options={{
									animation: "fade",
									gestureEnabled: false,
									orientation: "default",
								}}
							/>
							<Stack.Screen name="RecordingGuide" component={RecordingGuideScreen} />
							<Stack.Screen
								name="Recorder"
								component={RecorderScreen}
								options={{ presentation: "fullScreenModal" }}
							/>
							<Stack.Screen name="Settings" component={SettingsScreen} />
							<Stack.Screen name="NoticeList" component={NoticeListScreen} />
							<Stack.Screen
								name="ConsentSettings"
								component={ConsentSettingsScreen}
							/>
							<Stack.Screen name="Devices" component={DevicesScreen} />
							<Stack.Screen name="Permissions" component={PermissionsScreen} />
						</Stack.Group>
					) : null}
				</Stack.Navigator>
			</NavigationContainer>
			<OfflineBanner />
		</>
	)
}
