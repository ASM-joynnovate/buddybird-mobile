import { StyleSheet, View } from 'react-native';

import { useReadAllNotifications } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';

import NotificationList from '@/screens/home/components/notification-list';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TextButton } from '@/components/ui/text-button';

export function NotificationsScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const { isError, isPending, mutate } = useReadAllNotifications();

	return (
		<Screen scroll={false}>
			<View style={styles.container}>
				{/*헤더와 모두 읽음 실패 안내*/}
				<ScreenHeader
					title={t('home.notification.title')}
					onBack={() => navigation.goBack()}
					right=<TextButton
						label={t('home.notification.readAll')}
						disabled={isPending}
						onPress={() => mutate({})}
					/>
				/>
				<InlineError message={isError ? t('home.notification.readAllError') : null} />

				{/*알림 목록*/}
				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton rows={5} />>
					<NotificationList />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
});
