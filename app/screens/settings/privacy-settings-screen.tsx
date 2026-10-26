import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpenIcon } from 'lucide-react-native';

import PrivacyGroup from '@/screens/settings/components/privacy-group';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 개인정보 설정 화면 */
const PrivacySettingsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			<ScreenHeader title={t('settings.privacy.title')} onBack={() => navigation.goBack()} />

			<View style={styles.groupsContainer}>
				<ErrorHandlingWrapper fallbackComponent={ScreenError} errorSize="inline" suspenseFallback={null}>
					<PrivacyGroup />
				</ErrorHandlingWrapper>

				<ItemGroup>
					<Item
						isFirstInGroup
						icon={BookOpenIcon}
						label={t('settings.privacy.consents')}
						onPress={() => navigation.navigate('ConsentSettings')}
					/>
				</ItemGroup>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	groupsContainer: { gap: 28 },
});

export default PrivacySettingsScreen;
