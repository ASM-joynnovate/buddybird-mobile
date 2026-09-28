import { useQuery } from '@tanstack/react-query';

import type { ProfileStackParamList } from '@/types/navigation';

import { getMeOptions } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AccountForm } from '@/screens/profile/components/account-form';

import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function AccountEditorScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	const { data: meData, isError, refetch } = useQuery(getMeOptions());

	function body() {
		if (isError) {
			return <ScreenError message={t('common.loadError')} onRetry={() => void refetch()} />;
		}

		if (!meData) {
			return <Skeleton rows={2} />;
		}

		return <AccountForm user={meData} onSaved={() => navigation.goBack()} />;
	}

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader title={t('profile.editAccount')} onBack={() => navigation.goBack()} />

			{/*계정 편집 폼*/}
			{body()}
		</Screen>
	);
}
