import type { ProfileStackParamList } from '@/types/navigation';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { stackOptions } from '@/navigators/main-tabs/stack-options';
import { AccountEditorScreen } from '@/screens/profile/account-editor-screen';
import { ProfileScreen } from '@/screens/profile/profile-screen';

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileTab() {
	return (
		<ProfileStack.Navigator screenOptions={stackOptions}>
			<ProfileStack.Screen name="Profile" component={ProfileScreen} />
			<ProfileStack.Screen name="AccountEditor" component={AccountEditorScreen} />
		</ProfileStack.Navigator>
	);
}
