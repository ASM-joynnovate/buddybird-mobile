import type { RootStackParamList } from '@/types/navigation';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/screens/auth/login-screen';

const LoginStack = createNativeStackNavigator<RootStackParamList>();

/** 로그인 화면 navigator 컴포넌트 */
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
