import { useCallback } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MegaphoneIcon } from 'lucide-react-native';

import MarketingNotificationAnswer from '@/screens/onboarding/components/marketing-notification-answer';
import { trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { colors } from '@/theme';

import BuddySays from '@/components/buddy-says';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import Illustration from '@/components/illustration';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 마케팅 알림 수신 여부를 묻는 화면 */
const MarketingNotificationScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	/** 화면 진입 시 onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('marketing_notification');
		}, []),
	);

	return (
		<Screen
			footer={
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton blockCount={1} height={56} />
				>
					<MarketingNotificationAnswer />
				</ErrorHandlingWrapper>
			}
		>
			<ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

			<View style={styles.introContainer}>
				<BuddySays message={t('onboarding.marketing.intro')} />
				<Illustration
					scene={t('onboarding.marketing.scene')}
					icon={MegaphoneIcon}
					height={180}
					showMascot={false}
				/>
			</View>

			<Copy style={styles.hint}>{t('onboarding.marketing.hint')}</Copy>
		</Screen>
	);
};

const styles = StyleSheet.create({
	introContainer: { flexGrow: 1, gap: 24, paddingBottom: 28 },
	hint: { color: colors.muted, textAlign: 'center' },
});

export default MarketingNotificationScreen;
