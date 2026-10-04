import { useCallback } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MarketingNotificationAnswer from '@/screens/onboarding/components/marketing-notification-answer';
import MarketingNotificationAnswerSkeleton from '@/screens/onboarding/components/marketing-notification-answer-skeleton';
import MarketingScene from '@/screens/onboarding/components/marketing-scene';
import { trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { colors, contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import SceneSheet from '@/components/scene-sheet';
import { Copy } from '@/components/ui/copy';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
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
		<View style={styles.container}>
			<SafeAreaView edges={['top', 'left', 'right']}>
				<View style={styles.header}>
					<ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
				</View>
			</SafeAreaView>

			<MarketingScene />

			<SceneSheet
				title={t('onboarding.marketing.intro')}
				footer={
					<ErrorHandlingWrapper
						fallbackComponent={ScreenError}
						errorSize="inline"
						suspenseFallback=<MarketingNotificationAnswerSkeleton />
					>
						<MarketingNotificationAnswer />
					</ErrorHandlingWrapper>
				}
			>
				<Copy style={styles.hint}>{t('onboarding.marketing.hint')}</Copy>
			</SceneSheet>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.orangePale },
	header: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20 },
	hint: { color: colors.muted },
});

export default MarketingNotificationScreen;
