import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AccountSection from '@/screens/settings/components/account-section';
import GeneralGroup from '@/screens/settings/components/general-group';
import GeneralGroupSkeleton from '@/screens/settings/components/general-group-skeleton';
import SupportGroup from '@/screens/settings/components/support-group';
import { installedVersion } from '@/services/device/application';
import { colors } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
/** 설정 화면 */
const SettingsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			<ScreenHeader title={t('settings.title')} onBack={() => navigation.goBack()} />

			<View style={styles.sectionsContainer}>
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					errorSize="inline"
					suspenseFallback=<GeneralGroupSkeleton />
				>
					<GeneralGroup />
				</ErrorHandlingWrapper>

				<View style={styles.supportContainer}>
					<SupportGroup />

					{/*로그아웃, 회원 탈퇴 버튼 및 앱 버전*/}
					<View>
						<AccountSection />

						<Copy style={styles.version}>
							{t('settings.support.version', { version: installedVersion })}
						</Copy>
					</View>
				</View>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	sectionsContainer: { gap: 28 },
	supportContainer: { gap: 12 },
	version: { fontSize: 13, color: colors.muted, textAlign: 'center' },
});

export default SettingsScreen;
