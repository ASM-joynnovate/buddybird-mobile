import { useQuery } from '@tanstack/react-query';

import type { ProfileStackParamList } from '@/types/navigation';

import { meQueryOptions } from '@/hooks/apis/users';

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

	const me = useQuery(meQueryOptions());

	function body() {
		if (me.isError) {
			return <ScreenError message={t('common.loadError')} onRetry={() => void me.refetch()} />;
		}

		if (!me.data) {
			return <Skeleton rows={2} />;
		}

		return <AccountForm user={me.data} onSaved={() => navigation.goBack()} />;
	}

	return (
		<Screen>
			<ScreenHeader title={t('profile.editAccount')} onBack={() => navigation.goBack()} />
			{body()}
		</Screen>
	);
}
