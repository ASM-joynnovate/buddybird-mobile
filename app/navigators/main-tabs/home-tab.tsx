import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { stackOptions } from "@/navigators/main-tabs/stack-options"
import { HomeScreen } from "@/screens/home/home-screen"
import { NotificationsScreen } from "@/screens/home/notifications-screen"
import type { HomeStackParamList } from "@/types/navigation"

const HomeStack = createNativeStackNavigator<HomeStackParamList>()

export function HomeTab() {
	return (
		<HomeStack.Navigator screenOptions={stackOptions}>
			<HomeStack.Screen name="Home" component={HomeScreen} />
			<HomeStack.Screen name="Notifications" component={NotificationsScreen} />
		</HomeStack.Navigator>
	)
}
