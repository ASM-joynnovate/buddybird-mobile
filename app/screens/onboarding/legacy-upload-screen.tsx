import { useEffect, useState } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useGetParrotList } from '@/hooks/apis/parrots';

import { useTranslation } from 'react-i18next';

import { acceptLegacyUpload, finishLegacyUpload, uploadLegacy } from '@/services/migration/upload-legacy';
import { reportError, trackScreen } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors } from '@/theme';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ui } from '@/components/ui/styles';

/** v1 데이터 올리기 뒤 캐시 갱신과 올리기 단계 완료 */
const uploadAndFinishLegacy = async () => {
	await uploadLegacy();

	await invalidate(apiKeys.parrots.all(), apiKeys.words.all());

	trackOnboardingStepCompleted('legacy_upload');

	finishLegacyUpload();
};

/** v1 데이터를 올리는 동안 진행 표시를, 실패하면 다시 시도와 건너뛰기 버튼을 보여 주고 이미 앵무새가 있으면 추가할지 묻는 화면 */
const LegacyUploadScreen = () => {
	const { t } = useTranslation();

	const [uploadFailed, setUploadFailed] = useState(false);
	const [retryCount, setRetryCount] = useState(0);

	const { data: parrotListData } = useGetParrotList();

	const uploadStatus = useDeviceSettingsStore((state) => state.legacyMigration.uploadStatus);

	const askDialogOpen = uploadStatus === 'pending' && parrotListData.length > 0;
	const canStartUpload = !askDialogOpen;

	/** 화면을 열 때 screen_view와 onboarding_step_viewed 전송 */
	useEffect(() => {
		trackScreen('LegacyUpload');
		trackOnboardingStepViewed('legacy_upload');
	}, []);

	/** 올리기를 시작할 수 있을 때 v1 데이터 올리기와 실패 표시 */
	useEffect(() => {
		if (!canStartUpload) {
			return;
		}

		void uploadAndFinishLegacy().catch((error) => {
			reportError(error, 'legacy_upload');

			setUploadFailed(true);
		});
	}, [canStartUpload, retryCount]);

	/** 올리기 단계 완료 전송과 올리기 건너뛰기 */
	const handleSkip = () => {
		trackOnboardingStepCompleted('legacy_upload');

		finishLegacyUpload();
	};

	/** 실패 표시를 지우고 올리기 다시 시작 */
	const handleRetry = () => {
		setUploadFailed(false);
		setRetryCount((prev) => prev + 1);
	};

	return (
		<Screen scrollable={false}>
			{/*올리기 진행과 실패 안내*/}
			<View style={styles.container}>
				{uploadFailed ? (
					<>
						<Copy accessibilityRole="alert" style={styles.message}>
							{t('onboarding.legacy.uploadError')}
						</Copy>

						<Button label={t('common.retry')} onPress={handleRetry} />
						<Button label={t('common.skip')} variant="secondary" onPress={handleSkip} />
					</>
				) : (
					<>
						<ActivityIndicator color={colors.orange} />
						<Copy style={styles.message}>{t('onboarding.legacy.uploading')}</Copy>
					</>
				)}
			</View>

			{/*v1 데이터 추가 확인 다이얼로그*/}
			<Dialog
				visible={askDialogOpen}
				title={t('onboarding.legacy.askTitle')}
				onClose={() => {}}
				footer={
					<View style={ui.actions}>
						<Button
							label={t('common.skip')}
							variant="secondary"
							size="small"
							onPress={handleSkip}
							style={ui.action}
						/>
						<Button label={t('common.add')} size="small" onPress={acceptLegacyUpload} style={ui.action} />
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
