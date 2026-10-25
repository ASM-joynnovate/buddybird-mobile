import type { ReactNode } from 'react';

import { View } from 'react-native';

import { useTranslation } from 'react-i18next';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface ConfirmDialogText {
	title: string;
	message?: string;
	confirm?: string;
	cancel?: string;
}

interface Props {
	visible: boolean;
	text: ConfirmDialogText;
	confirmBusy?: boolean;
	onConfirm: () => void;
	onClose: () => void;
	children?: ReactNode;
}

/**
 * 확인 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param text 다이얼로그 문구
 * @param confirmBusy 확인 요청 진행 중 여부
 * @param onConfirm 확인 버튼을 누를 때 실행할 함수
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 * @param children 안내 문구 아래에 표시할 내용
 */
const ConfirmDialog = ({ visible, text, confirmBusy = false, onConfirm, onClose, children }: Props) => {
	const { t } = useTranslation();

	return (
		<Dialog
			visible={visible}
			title={text.title}
			onClose={confirmBusy ? () => {} : onClose}
			footer={
				<View style={ui.actionsRow}>
					<Button
						label={text.cancel ?? t('common.cancel')}
						variant="secondary"
						size="small"
						disabled={confirmBusy}
						depth="high"
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={text.confirm ?? t('common.confirmDelete.confirm')}
						size="small"
						loading={confirmBusy}
						depth="high"
						onPress={onConfirm}
						style={ui.action}
					/>
				</View>
			}
		>
			{!!text.message && <Copy>{text.message}</Copy>}
			{children}
		</Dialog>
	);
};

export default ConfirmDialog;
