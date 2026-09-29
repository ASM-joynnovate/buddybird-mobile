import { StyleSheet } from 'react-native';

import { useWithdraw } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { signOutLocally } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';
import { colors } from '@/theme';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Copy } from '@/components/ui/copy';

interface Props {
	visible: boolean;
	onClose: () => void;
}

/**
 * 회원 탈퇴 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 */
const WithdrawDialog = ({ visible, onClose }: Props) => {
	const { t } = useTranslation();

	const { isPending, error, mutate, reset } = useWithdraw();

	const handleWithdraw = () => {
		if (isPending) {
			return;
		}

		mutate(undefined, {
			onSuccess: () => void signOutLocally().catch((e: unknown) => reportError(e, 'withdraw')),
		});
	};

	const handleClose = () => {
		reset();

		onClose();
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('settings.withdrawDialog.title'),
				message: t('settings.withdrawDialog.message'),
				confirm: t('settings.withdrawDialog.confirm'),
			}}
			confirmStatus={{ busy: isPending, errorMessage: error ? apiErrorMessage(error, t) : null }}
			onConfirm={handleWithdraw}
			onClose={handleClose}
		>
			<Copy style={styles.warning}>{t('settings.withdrawDialog.warning')}</Copy>
		</ConfirmDialog>
	);
};

const styles = StyleSheet.create({
	warning: { color: colors.muted },
});

export default WithdrawDialog;
