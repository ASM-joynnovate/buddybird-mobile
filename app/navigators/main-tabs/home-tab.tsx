import type { HomeStackParamList } from '@/types/navigation';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackOptions } from '@/navigators/main-tabs/stack-options';
import HomeScreen from '@/screens/home/home-screen';
import NotificationsScreen from '@/screens/home/notifications-screen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

/** 홈 탭 navigator 컴포넌트 */
const HomeTab = () => {
	return (
		<HomeStack.Navigator screenOptions={stackOptions}>
			<HomeStack.Screen name="Home" component={HomeScreen} />
			<HomeStack.Screen name="Notifications" component={NotificationsScreen} />
		</HomeStack.Navigator>
	);
};

export default HomeTab;
