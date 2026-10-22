import type { CommunityStackParamList } from '@/types/navigation';

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Toaster } from 'sonner-native';

import { SECOND } from '@/config/units';
import { stackOptions } from '@/navigators/main-tabs/stack-options';
import CommunityScreen from '@/screens/community/community-screen';
import LeaderboardScreen from '@/screens/community/leaderboard-screen';

const TOAST_GAP = 10;

const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();

/** 커뮤니티 탭 navigator 컴포넌트 */
const CommunityTab = () => {
	const tabBarHeight = useBottomTabBarHeight();

	return (
		<>
			<CommunityStack.Navigator screenOptions={stackOptions}>
				<CommunityStack.Screen name="Community" component={CommunityScreen} />
				<CommunityStack.Screen name="Leaderboard" component={LeaderboardScreen} />
			</CommunityStack.Navigator>

			{/*탭 바 바로 위에 뜨는 토스트*/}
			<Toaster position="bottom-center" offset={tabBarHeight + TOAST_GAP} duration={3 * SECOND} />
		</>
	);
};

export default CommunityTab;
