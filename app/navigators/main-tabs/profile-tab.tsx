import type { ProfileStackParamList } from '@/types/navigation';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackOptions } from '@/navigators/main-tabs/stack-options';
import AccountEditorScreen from '@/screens/profile/account-editor-screen';
import ProfileScreen from '@/screens/profile/profile-screen';

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/** 프로필 탭 navigator 컴포넌트 */
const ProfileTab = () => {
	return (
		<ProfileStack.Navigator screenOptions={stackOptions}>
			<ProfileStack.Screen name="Profile" component={ProfileScreen} />
			<ProfileStack.Screen name="AccountEditor" component={AccountEditorScreen} />
		</ProfileStack.Navigator>
	);
};

export default ProfileTab;
