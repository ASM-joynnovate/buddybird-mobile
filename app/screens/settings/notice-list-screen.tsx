import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import NoticeList from '@/screens/settings/components/notice-list';
import NoticeListSkeleton from '@/screens/settings/components/notice-list-skeleton';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
/** 공지 목록 화면 */
const NoticeListScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ScreenHeader title={t('settings.notices.title')} onBack={() => navigation.goBack()} />

				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<NoticeListSkeleton />>
					<NoticeList />
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
		paddingTop: 20,
	},
});

export default NoticeListScreen;
