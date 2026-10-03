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

/** 알림 목록 화면 */
const NotificationsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const { isError, isPending, mutate } = useReadAllNotifications();

	const handleReadAll = () => {
		if (isPending) {
			return;
		}

		mutate({});
	};

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ScreenHeader
					title={t('home.notificationList.title')}
					onBack={() => navigation.goBack()}
					trailing=<TextButton
						label={t('home.notificationList.readAll')}
						disabled={isPending}
						onPress={handleReadAll}
					/>
				/>
				<InlineError message={isError ? t('home.notificationList.readAllError') : null} />

				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton blockCount={5} />>
					<NotificationList />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
};

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

export default NotificationsScreen;
