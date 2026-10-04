import type { RootStackParamList } from '@/types/navigation';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/screens/onboarding/login-screen';

const LoginStack = createNativeStackNavigator<RootStackParamList>();

/** 계정이 없을 때 로그인 화면만 보여 주는 navigator 컴포넌트 */
const LoginNavigator = () => {
	return (
		<NavigationContainer>
			<LoginStack.Navigator screenOptions={{ headerShown: false, orientation: 'portrait' }}>
				<LoginStack.Screen name="Login" component={LoginScreen} initialParams={{ source: 'onboarding' }} />
			</LoginStack.Navigator>
		</NavigationContainer>
	);
};

export default LoginNavigator;
