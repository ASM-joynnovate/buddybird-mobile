import { StyleSheet, View } from 'react-native';

import { useInfiniteQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { getNoticeListOptions } from '@/hooks/apis/notices';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AccountActions } from '@/screens/settings/components/account-actions';
import { GeneralGroup } from '@/screens/settings/components/general-group';
import SleepAndNotificationGroups from '@/screens/settings/components/sleep-and-notification-groups';
import { SupportGroup } from '@/screens/settings/components/support-group';
import { useAccountStore } from '@/stores/account';
import { useFeedbackStore } from '@/stores/feedback';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function SettingsScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: noticeListData } = useInfiniteQuery({ ...getNoticeListOptions(), throwOnError: false });

	const isAnonymous = useAccountStore((account) => account.isAnonymous);

	const feedback = useFeedbackStore();

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader title={t('settings.title')} onBack={() => navigation.goBack()} />

			{/*설정 그룹*/}
			<View style={styles.sections}>
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton rows={3} height={56} />
				>
					<SleepAndNotificationGroups />
				</ErrorHandlingWrapper>

				<GeneralGroup
					onOpenDevices={() => navigation.navigate(isAnonymous ? 'Login' : 'Devices')}
					onOpenPermissions={() => navigation.navigate('Permissions')}
				/>

				<AccountActions onSignIn={() => navigation.navigate('Login')} />

				<SupportGroup
					unreadNotice={Boolean(
						noticeListData?.pages.some((page) => page.data.some((notice) => !notice.is_read)),
					)}
					onFeedback={() => feedback.openFeedback('profile')}
					onOpenNotices={() => navigation.navigate('NoticeList')}
					onOpenConsents={() => navigation.navigate('ConsentSettings')}
				/>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	sections: { gap: 28 },
});
