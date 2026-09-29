import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AccountSection from '@/screens/settings/components/account-section';
import GeneralGroup from '@/screens/settings/components/general-group';
import SleepAndNotificationGroups from '@/screens/settings/components/sleep-and-notification-groups';
import SupportGroup from '@/screens/settings/components/support-group';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 설정 제목과 뒤로 가기 버튼, 앵무새 케어와 알림, 일반, 계정, 지원 설정을 보여 주는 화면 */
const SettingsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			{/*설정 제목과 뒤로 가기 버튼*/}
			<ScreenHeader title={t('settings.title')} onBack={() => navigation.goBack()} />

			{/*앵무새 케어, 알림, 일반, 계정, 지원 설정*/}
			<View style={styles.sectionsContainer}>
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton blockCount={3} height={56} />
				>
					<SleepAndNotificationGroups />
				</ErrorHandlingWrapper>

				<GeneralGroup />

				<AccountSection />

				<SupportGroup />
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	sectionsContainer: { gap: 28 },
});

export default SettingsScreen;
