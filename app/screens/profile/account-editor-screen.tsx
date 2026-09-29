import type { ProfileStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AccountForm from '@/screens/profile/components/account-form';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 계정 편집 화면 */
const AccountEditorScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	return (
		<Screen>
			<ScreenHeader title={t('profile.editAccount')} onBack={() => navigation.goBack()} />

			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton blockCount={2} />>
				<AccountForm onSaved={() => navigation.goBack()} />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default AccountEditorScreen;
