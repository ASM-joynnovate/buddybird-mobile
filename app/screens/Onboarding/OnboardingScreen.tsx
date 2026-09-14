import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { ProfileStep } from "@/screens/Onboarding/components/profile-step"
import { Welcome } from "@/screens/Onboarding/components/welcome"
import { useOnboarding } from "@/screens/Onboarding/hooks/use-onboarding"

const Stack = createNativeStackNavigator<{ Welcome: undefined; Profile: undefined }>()

export function OnboardingScreen() {
	const { begin, profile } = useOnboarding()

	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Welcome" listeners={{ focus: profile.onBack }}>
				{({ navigation }) => (
					<Welcome
						onStart={() => {
							begin()
							navigation.navigate("Profile")
						}}
					/>
				)}
			</Stack.Screen>
			<Stack.Screen name="Profile">
				{({ navigation }) => (
					<ProfileStep
						onboarding={{
							...profile,
							onBack: () => {
								profile.onBack()
								navigation.goBack()
							},
						}}
					/>
				)}
			</Stack.Screen>
		</Stack.Navigator>
	)
}
