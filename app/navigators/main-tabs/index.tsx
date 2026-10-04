import type { MainTabParamList } from '@/types/navigation';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeTab from '@/navigators/main-tabs/home-tab';
import ProfileTab from '@/navigators/main-tabs/profile-tab';
import ReportTab from '@/navigators/main-tabs/report-tab';
import WordsTab from '@/navigators/main-tabs/words-tab';
import { colors } from '@/theme';

import TabBar from '@/components/navigation/tab-bar';

const Tabs = createBottomTabNavigator<MainTabParamList>();

/** 하단 탭 navigator 컴포넌트 */
const MainTabs = () => {
	return (
		<Tabs.Navigator
			screenOptions={{
				headerShown: false,
				popToTopOnBlur: true,
				sceneStyle: { backgroundColor: colors.background },
			}}
			tabBar={(props) => <TabBar {...props} />}
		>
			<Tabs.Screen name="HomeTab" component={HomeTab} />
			<Tabs.Screen name="WordsTab" component={WordsTab} />
			<Tabs.Screen name="ReportTab" component={ReportTab} />
			<Tabs.Screen name="ProfileTab" component={ProfileTab} />
		</Tabs.Navigator>
	);
};

export default MainTabs;
