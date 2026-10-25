import { StyleSheet } from 'react-native';

import { useWithdraw } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import { colors } from '@/theme';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Copy } from '@/components/ui/copy';
import { dialogToasterId, Toast } from '@/components/ui/toast';

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

	const { isPending, mutate } = useWithdraw();

	const handleWithdraw = () => {
		if (isPending) {
			return;
		}

		mutate(undefined, {
			onError: (error) => {
				toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />, {
					toasterId: dialogToasterId,
				});
			},
		});
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('settings.withdrawDialog.title'),
				message: t('settings.withdrawDialog.message'),
				confirm: t('settings.withdrawDialog.confirm'),
			}}
			confirmBusy={isPending}
			onConfirm={handleWithdraw}
			onClose={onClose}
		>
			<Copy style={styles.warning}>{t('settings.withdrawDialog.warning')}</Copy>
		</ConfirmDialog>
	);
};

const styles = StyleSheet.create({
	warning: { color: colors.muted },
});

export default WithdrawDialog;
