import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ConsentList from '@/screens/settings/components/consent-list';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function ConsentSettingsScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader title={t('settings.consents.title')} onBack={() => navigation.goBack()} />

			{/*동의 항목*/}
			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton rows={4} height={56} />>
				<ConsentList />
			</ErrorHandlingWrapper>
		</Screen>
	);
}
