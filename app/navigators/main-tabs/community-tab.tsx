import type { CommunityStackParamList } from '@/types/navigation';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackOptions } from '@/navigators/main-tabs/stack-options';
import CommunityScreen from '@/screens/community/community-screen';
import LeaderboardScreen from '@/screens/community/leaderboard-screen';

const CommunityStack = createNativeStackNavigator<CommunityStackParamList>();

/** 커뮤니티 탭 navigator 컴포넌트 */
const CommunityTab = () => {
	return (
		<CommunityStack.Navigator screenOptions={stackOptions}>
			<CommunityStack.Screen name="Community" component={CommunityScreen} />
			<CommunityStack.Screen name="Leaderboard" component={LeaderboardScreen} />
		</CommunityStack.Navigator>
	);
};

export default CommunityTab;
