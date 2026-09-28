import { StyleSheet } from 'react-native';

import { useMutation } from '@tanstack/react-query';

import { withdrawMutationOptions } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { signOutToAnonymous } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';
import { colors } from '@/theme';

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { Copy } from '@/components/ui/text';

interface Props {
	visible: boolean;
	onClose(): void;
}

export function WithdrawDialog({ visible, onClose }: Props) {
	const { t } = useTranslation();

	const { isPending, error, mutate, reset } = useMutation({
		...withdrawMutationOptions(),
		onSuccess: () => signOutToAnonymous(),
		onError: (cause) => reportError(cause, 'withdraw'),
	});

	function handleWithdraw() {
		if (isPending) {
			return;
		}

		mutate();
	}

	function handleClose() {
		reset();

		onClose();
	}

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('settings.withdrawDialog.title'),
				message: t('settings.withdrawDialog.message'),
				confirm: t('settings.withdrawDialog.confirm'),
			}}
			state={{ busy: isPending, error: error ? apiErrorMessage(error, t) : null }}
			onConfirm={handleWithdraw}
			onClose={handleClose}
		>
			<Copy style={styles.line}>{t('settings.withdrawDialog.line')}</Copy>
		</ConfirmDialog>
	);
}

const styles = StyleSheet.create({
	line: { color: colors.muted },
});
