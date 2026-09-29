import type { ReactNode } from 'react';

import { View } from 'react-native';

import { useTranslation } from 'react-i18next';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';

interface Props {
	visible: boolean;
	text: { title: string; message?: string; confirm?: string; cancel?: string };
	confirmStatus?: { busy?: boolean; errorMessage?: string | null };
	onConfirm: () => void;
	onClose: () => void;
	children?: ReactNode;
}

/**
 * 확인 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param text 다이얼로그 문구
 * @param confirmStatus 확인 요청 상태
 * @param onConfirm 확인 버튼을 누를 때 실행할 함수
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 * @param children 안내 문구 아래에 표시할 내용
 */
const ConfirmDialog = ({ visible, text, confirmStatus, onConfirm, onClose, children }: Props) => {
	const { t } = useTranslation();

	const busy = confirmStatus?.busy ?? false;

	return (
		<Dialog
			visible={visible}
			title={text.title}
			onClose={busy ? () => {} : onClose}
			footer={
				<View style={ui.actionsRow}>
					<Button
						label={text.cancel ?? t('common.cancel')}
						variant="secondary"
						size="small"
						disabled={busy}
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={text.confirm ?? t('common.confirmDelete.confirm')}
						size="small"
						loading={busy}
						onPress={onConfirm}
						style={ui.action}
					/>
				</View>
			}
		>
			{!!text.message && <Copy>{text.message}</Copy>}
			{children}

			<InlineError message={confirmStatus?.errorMessage} />
		</Dialog>
	);
};

export default ConfirmDialog;
