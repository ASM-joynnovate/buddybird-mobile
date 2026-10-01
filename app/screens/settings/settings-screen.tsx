import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AccountSection from '@/screens/settings/components/account-section';
import GeneralGroup from '@/screens/settings/components/general-group';
import SupportGroup from '@/screens/settings/components/support-group';
import { installedVersion } from '@/services/device/application';
import { colors } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

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
					suspenseFallback=<Skeleton blockCount={4} height={56} />
				>
					<GeneralGroup />
				</ErrorHandlingWrapper>

				<View style={styles.supportContainer}>
					<SupportGroup />

					{/*앱 버전과 로그아웃, 회원 탈퇴 버튼*/}
					<View style={styles.footerRow}>
						<Copy style={styles.version}>
							{t('settings.support.version', { version: installedVersion })}
						</Copy>

						<AccountSection />
					</View>
				</View>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	sectionsContainer: { gap: 28 },
	supportContainer: { gap: 12 },
	footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
	version: { fontSize: 13, color: colors.muted },
});

export default SettingsScreen;
