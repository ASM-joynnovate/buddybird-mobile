import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import { TabBar } from "@/components/navigation/tab-bar"
import { LearningScreen } from "@/screens/Learning/LearningScreen"
import { ProfileScreen } from "@/screens/Profile/ProfileScreen"
import { WordsScreen } from "@/screens/Words/WordsScreen"
import { colors } from "@/theme"
import { MainTabParamList } from "@/types/navigation"

const Tabs = createBottomTabNavigator<MainTabParamList>()

export function MainTabs() {
	return (
		<Tabs.Navigator
			screenOptions={{
				headerShown: false,
				sceneStyle: { backgroundColor: colors.background },
			}}
			tabBar={(props) => <TabBar {...props} />}
		>
			<Tabs.Screen name="Learn" component={LearningScreen} />
			<Tabs.Screen name="Words" component={WordsScreen} />
			<Tabs.Screen name="Profile" component={ProfileScreen} />
		</Tabs.Navigator>
	)
}
