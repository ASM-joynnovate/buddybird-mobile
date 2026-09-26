import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import { TabBar } from "@/components/navigation/tab-bar"
import { HomeTab } from "@/navigators/main-tabs/home-tab"
import { ProfileTab } from "@/navigators/main-tabs/profile-tab"
import { ReportTab } from "@/navigators/main-tabs/report-tab"
import { WordsTab } from "@/navigators/main-tabs/words-tab"
import { colors } from "@/theme"
import type { MainTabParamList } from "@/types/navigation"

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
			<Tabs.Screen name="HomeTab" component={HomeTab} />
			<Tabs.Screen name="WordsTab" component={WordsTab} />
			<Tabs.Screen name="ReportTab" component={ReportTab} />
			<Tabs.Screen name="ProfileTab" component={ProfileTab} />
		</Tabs.Navigator>
	)
}
