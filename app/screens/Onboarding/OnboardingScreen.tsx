import {
	createNativeStackNavigator,
	type NativeStackScreenProps,
} from "@react-navigation/native-stack"

import { ProfileStep } from "@/screens/Onboarding/components/profile-step"
import { Welcome } from "@/screens/Onboarding/components/welcome"
import { useOnboarding } from "@/screens/Onboarding/hooks/use-onboarding"

type OnboardingParams = { Welcome: undefined; Profile: undefined }

const Stack = createNativeStackNavigator<OnboardingParams>()

export function OnboardingScreen() {
	const { begin, profile } = useOnboarding()

	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Welcome" listeners={{ focus: profile.onBack }}>
				{({ navigation }: NativeStackScreenProps<OnboardingParams, "Welcome">) => (
					<Welcome
						onStart={() => {
							begin()
							navigation.navigate("Profile")
						}}
					/>
				)}
			</Stack.Screen>
			<Stack.Screen name="Profile">
				{({ navigation }: NativeStackScreenProps<OnboardingParams, "Profile">) => (
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
