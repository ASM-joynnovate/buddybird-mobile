import { useEffect } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useGetParrotList } from '@/hooks/apis/parrots';
import useStartupLanding from '@/hooks/use-startup-landing';

import { useTranslation } from 'react-i18next';

import useUploadLegacy from '@/screens/onboarding/hooks/use-upload-legacy';
import { acceptLegacyUpload, finishLegacyUpload } from '@/services/migration/upload-legacy';
import { trackScreen } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors } from '@/theme';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ui } from '@/components/ui/styles';

/** v1 데이터 업로드 화면 */
const LegacyUploadScreen = () => {
	const { t } = useTranslation();

	const { data: parrotListData } = useGetParrotList();

	const uploadStatus = useDeviceSettingsStore((state) => state.legacyMigration.uploadStatus);

	const { isError, isIdle, mutate } = useUploadLegacy();

	// 횃대 및 버디를 위로 이동
	useStartupLanding();

	const askDialogOpen = uploadStatus === 'pending' && parrotListData.length > 0;
	const canStartUpload = !askDialogOpen;

	/** 화면 진입 시 조회 이벤트 전송 */
	useEffect(() => {
		trackScreen('LegacyUpload');
		trackOnboardingStepViewed('legacy_upload');
	}, []);

	/** 업로드를 시작할 수 있으면 v1 데이터 업로드 */
	useEffect(() => {
		if (!canStartUpload || !isIdle) {
			return;
		}

		mutate();
	}, [canStartUpload, isIdle, mutate]);

	const handleSkip = () => {
		trackOnboardingStepCompleted('legacy_upload');

		finishLegacyUpload();
	};

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				{isError ? (
					<>
						<Copy accessibilityRole="alert" style={styles.message}>
							{t('onboarding.legacy.uploadError')}
						</Copy>

						<Button label={t('common.retry')} onPress={() => mutate()} />
						<Button label={t('common.skip')} variant="secondary" onPress={handleSkip} />
					</>
				) : (
					<>
						<ActivityIndicator color={colors.orange} />
						<Copy style={styles.message}>{t('onboarding.legacy.uploading')}</Copy>
					</>
				)}
			</View>

			{/*v1 앵무새 추가 확인 다이얼로그*/}
			<Dialog
				visible={askDialogOpen}
				title={t('onboarding.legacy.askTitle')}
				onClose={() => {}}
				footer={
					<View style={ui.actionsRow}>
						<Button
							label={t('common.skip')}
							variant="secondary"
							size="small"
							depth="high"
							onPress={handleSkip}
							style={ui.action}
						/>
						<Button
							label={t('common.add')}
							size="small"
							depth="high"
							onPress={acceptLegacyUpload}
							style={ui.action}
						/>
					</View>
				}
			/>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: 'center', gap: 16, padding: 24 },
	message: { textAlign: 'center' },
});

export default LegacyUploadScreen;
