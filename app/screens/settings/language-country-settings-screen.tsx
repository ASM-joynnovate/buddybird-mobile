import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import CountryPicker from '@/screens/settings/components/country-picker';
import LanguagePicker from '@/screens/settings/components/language-picker';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { ItemGroup } from '@/components/ui/item/group';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 언어 및 국가 설정 화면 */
const LanguageCountrySettingsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			<ScreenHeader title={t('settings.general.languageAndCountry')} onBack={() => navigation.goBack()} />

			<ErrorHandlingWrapper fallbackComponent={ScreenError} errorSize="inline" suspenseFallback={null}>
				<ItemGroup>
					<LanguagePicker />
					<CountryPicker />
				</ItemGroup>
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default LanguageCountrySettingsScreen;
