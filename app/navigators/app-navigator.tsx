import {
	NavigationContainer,
	StackActions,
	useNavigationContainerRef,
} from "@react-navigation/native"

import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { useEffect, useRef, useState } from "react"

import { useNeedsProfileOnboarding, useProfile } from "@/hooks/use-app-data"
import { useSession } from "@/hooks/use-session"
import { MainTabs } from "@/navigators/main-tabs"
import { OnboardingScreen } from "@/screens/Onboarding/OnboardingScreen"
import { ProfileEditorScreen } from "@/screens/Profile/ProfileEditorScreen"
import { SessionCapturesScreen } from "@/screens/SessionCaptures/SessionCapturesScreen"
import { SessionScreen } from "@/screens/Session/SessionScreen"
import { WordEditorScreen } from "@/screens/Words/WordEditorScreen"
import { colors } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator() {
	const profile = useProfile()
	const needsOnboarding = useNeedsProfileOnboarding()
	const { snapshot } = useSession()
	const navigation = useNavigationContainerRef<RootStackParamList>()

	const [ready, setReady] = useState(false)
	const lastDismissed = useRef<string | null>(null)
	const [dismissed, setDismissed] = useState<string | null>(null)

	const hasProfile = Boolean(profile)

	useEffect(() => {
		if (!ready || !hasProfile || !navigation.isReady()) {
			return
		}

		const shouldShowSession = [
			"starting",
			"running",
			"paused",
			"interrupted",
			"stopping",
			"completed",
		].includes(snapshot.state)

		if (
			shouldShowSession &&
			snapshot.sessionId !== dismissed &&
			navigation.getCurrentRoute()?.name !== "Session" &&
			!(
				snapshot.state === "completed" &&
				navigation.getCurrentRoute()?.name === "SessionCaptures"
			)
		) {
			navigation.navigate("Session")
		}

		if (snapshot.state === "idle" && navigation.getCurrentRoute()?.name === "Session") {
			navigation.goBack()
		}
	}, [ready, hasProfile, snapshot.state, snapshot.sessionId, dismissed, navigation])

	function continueFromSession() {
		if (lastDismissed.current === snapshot.sessionId) {
			return
		}

		lastDismissed.current = snapshot.sessionId
		setDismissed(snapshot.sessionId)
		navigation.dispatch(StackActions.popTo("Main"))
	}

	return (
		<NavigationContainer ref={navigation} onReady={() => setReady(true)}>
			<Stack.Navigator
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: colors.background },
				}}
			>
				{needsOnboarding ? (
					<Stack.Screen name="Onboarding" component={OnboardingScreen} />
				) : (
					<>
						<Stack.Screen name="Main" component={MainTabs} />
						<Stack.Screen name="ProfileEditor" component={ProfileEditorScreen} />
						<Stack.Screen
							name="WordEditor"
							component={WordEditorScreen}
							options={{ presentation: "fullScreenModal", animation: "fade" }}
						/>
						<Stack.Screen name="SessionCaptures" component={SessionCapturesScreen} />
						<Stack.Screen name="Session" options={{ animation: "fade" }}>
							{() => <SessionScreen onContinue={continueFromSession} />}
						</Stack.Screen>
					</>
				)}
			</Stack.Navigator>
		</NavigationContainer>
	)
}
