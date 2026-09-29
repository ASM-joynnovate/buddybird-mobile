import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { PromptedUpdate } from '@/types/update';

import { useTranslation } from 'react-i18next';

import { openAppStore } from '@/services/device/application';
import { reportError, track } from '@/services/telemetry/client';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';

interface Props {
	promptedUpdate: PromptedUpdate;
	visible: boolean;
	onDismiss: () => void;
	onStoreOpened: () => void;
}

/**
 * 새 버전 안내, 변경 내용, 업데이트 버튼을 보여 주고 업데이트 버튼을 누르면 앱 스토어를 여는 다이얼로그 컴포넌트
 * @param promptedUpdate 안내할 최신 버전, 강제 업데이트 여부, 변경 내용
 * @param visible 다이얼로그 표시 여부
 * @param onDismiss 닫기 버튼을 누를 때 실행할 함수
 * @param onStoreOpened 선택 업데이트에서 스토어를 연 뒤 실행할 함수
 */
const UpdateDialog = ({ promptedUpdate, visible, onDismiss, onStoreOpened }: Props) => {
	const { t } = useTranslation();

	const [appStoreOpening, setAppStoreOpening] = useState(false);
	const [appStoreOpenFailed, setAppStoreOpenFailed] = useState(false);

	const forced = promptedUpdate?.forced ?? false;

	/** 업데이트 수락 시 스토어 열기 */
	const handleAcceptUpdate = async () => {
		if (!promptedUpdate || appStoreOpening) {
			return;
		}

		setAppStoreOpening(true);
		setAppStoreOpenFailed(false);

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

			setAppStoreOpenFailed(true);
		} finally {
			setAppStoreOpening(false);
		}
	};

	/** 닫기 요청 시 선택 업데이트 안내 닫기 */
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
							onPress={onDismiss}
							style={ui.action}
						/>
					)}
					<Button
						label={t('app.update.accept')}
						loading={appStoreOpening}
						onPress={() => void handleAcceptUpdate()}
						style={ui.action}
					/>
				</View>
			}
		>
			{/*업데이트 안내와 변경 내용*/}
			<Copy style={styles.body}>
				{t(forced ? 'app.update.forcedMessage' : 'app.update.message', {
					version: promptedUpdate?.latestVersion ?? '',
				})}
			</Copy>
			{(promptedUpdate?.notes ?? []).map((note, index) => (
				<Copy key={`${index}-${note}`} style={styles.note}>
					{note}
				</Copy>
			))}

			{/*스토어 열기 실패 문구*/}
			<InlineError message={appStoreOpenFailed ? t('app.update.openStoreError') : null} />
		</Dialog>
	);
};

const styles = StyleSheet.create({
	body: { fontSize: 17, lineHeight: 27 },
	actionsRow: { marginTop: 0 },
	note: { marginTop: 12, lineHeight: 24 },
});

export default UpdateDialog;
