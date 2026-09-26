import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { stackOptions } from "@/navigators/main-tabs/stack-options"
import { AccountEditorScreen } from "@/screens/Profile/AccountEditorScreen"
import { ProfileScreen } from "@/screens/Profile/ProfileScreen"
import type { ProfileStackParamList } from "@/types/navigation"

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>()

export function ProfileTab() {
	return (
		<ProfileStack.Navigator screenOptions={stackOptions}>
			<ProfileStack.Screen name="Profile" component={ProfileScreen} />
			<ProfileStack.Screen name="AccountEditor" component={AccountEditorScreen} />
		</ProfileStack.Navigator>
	)
}
