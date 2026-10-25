import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import { openAppStore } from '@/services/device/application';
import { reportError, track } from '@/services/telemetry/client';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';
import { dialogToasterId, Toast } from '@/components/ui/toast';

interface PromptedUpdate {
	latestVersion: string | null;
	forced: boolean;
	notes: string[];
}

interface Props {
	promptedUpdate: PromptedUpdate | null;
	visible: boolean;
	onDismiss: () => void;
	onStoreOpened: () => void;
}

/**
 * 업데이트 안내 다이얼로그 컴포넌트
 * @param promptedUpdate 안내할 업데이트 정보
 * @param visible 다이얼로그 표시 여부
 * @param onDismiss 닫기 버튼을 누를 때 실행할 함수
 * @param onStoreOpened 스토어 페이지 이동 후 실행할 함수
 */
const UpdateDialog = ({ promptedUpdate, visible, onDismiss, onStoreOpened }: Props) => {
	const { t } = useTranslation();

	const [appStoreOpening, setAppStoreOpening] = useState(false);

	const forced = promptedUpdate?.forced ?? false;

	const handleAcceptUpdate = async () => {
		if (!promptedUpdate || appStoreOpening) {
			return;
		}

		setAppStoreOpening(true);

		try {
			track('update_prompt_accepted', {
				latest_version: promptedUpdate.latestVersion,
				is_forced: promptedUpdate.forced,
			});

			await openAppStore();

			if (!promptedUpdate.forced) {
				onStoreOpened();
			}
		} catch (e) {
			reportError(e, 'open_store');

			toast.custom(<Toast variant="error" message={t('app.update.openStoreError')} />, {
				toasterId: dialogToasterId,
			});
		} finally {
			setAppStoreOpening(false);
		}
	};

	const handleClose = () => {
		if (!forced && !appStoreOpening) {
			onDismiss();
		}
	};

	return (
		<Dialog
			visible={visible}
			onClose={handleClose}
			title={t(forced ? 'app.update.forcedTitle' : 'app.update.title')}
			footer={
				<View style={[ui.actionsRow, styles.actionsRow]}>
					{!forced && (
						<Button
							label={t('common.close')}
							variant="secondary"
							disabled={appStoreOpening}
							depth="high"
							onPress={onDismiss}
							style={ui.action}
						/>
					)}
					<Button
						label={t('app.update.accept')}
						loading={appStoreOpening}
						depth="high"
						onPress={() => void handleAcceptUpdate()}
						style={ui.action}
					/>
				</View>
			}
		>
			<Copy style={styles.body}>
				{promptedUpdate?.latestVersion === null
					? t('app.update.forcedMessageWithoutVersion')
					: t(forced ? 'app.update.forcedMessage' : 'app.update.message', {
							version: promptedUpdate?.latestVersion ?? '',
						})}
			</Copy>
			{(promptedUpdate?.notes ?? []).map((note, index) => (
				<Copy key={`${index}-${note}`} style={styles.note}>
					{note}
				</Copy>
			))}
		</Dialog>
	);
};

const styles = StyleSheet.create({
	body: { fontSize: 17, lineHeight: 27 },
	actionsRow: { marginTop: 0 },
	note: { marginTop: 12, lineHeight: 24 },
});

export default UpdateDialog;
