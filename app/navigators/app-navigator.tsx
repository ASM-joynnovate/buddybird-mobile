import {
	NavigationContainer,
	type NavigationState,
	type PartialState,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { StartupScreen } from "@/components/app/startup-screen"
import { OfflineBanner } from "@/components/offline-banner"
import { type EntryRoute, useEntryRoute } from "@/hooks/use-entry-route"
import { MainTabs } from "@/navigators/main-tabs"
import { ConsentDetailScreen } from "@/screens/Entry/ConsentDetailScreen"
import { ConsentScreen } from "@/screens/Entry/ConsentScreen"
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
import { colors } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

const Stack = createNativeStackNavigator<RootStackParamList>()

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
	route: Exclude<EntryRoute, "loading" | "error">,
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

	if (route === "loading" || route === "error") {
		return <StartupScreen failed={route === "error"} onRetry={retry} />
	}

	return (
		<>
			<NavigationContainer key={route} initialState={initialStateOf(route, parrotId)}>
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
								options={{ animation: "fade", gestureEnabled: false }}
							/>
							<Stack.Screen
								name="SessionSummary"
								component={SessionSummaryScreen}
								options={{ animation: "fade", gestureEnabled: false }}
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
