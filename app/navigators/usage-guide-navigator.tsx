import type { UsageGuideStackParamList } from '@/types/navigation';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import UsageGuideScreen from '@/screens/onboarding/usage-guide-screen';

const UsageGuideStack = createNativeStackNavigator<UsageGuideStackParamList>();

/** 사용 안내 화면 navigator 컴포넌트 */
const UsageGuideNavigator = () => {
	return (
		<NavigationContainer>
			<UsageGuideStack.Navigator screenOptions={{ headerShown: false, orientation: 'portrait' }}>
				<UsageGuideStack.Screen name="UsageGuide" component={UsageGuideScreen} />
			</UsageGuideStack.Navigator>
		</NavigationContainer>
	);
};

export default UsageGuideNavigator;
