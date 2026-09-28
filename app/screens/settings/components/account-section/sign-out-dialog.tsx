import { useLogout } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { signOutLocally } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';

interface Props {
	visible: boolean;
	onClose(): void;
}

export function SignOutDialog({ visible, onClose }: Props) {
	const { t } = useTranslation();

	const { isPending, isError, mutate, reset } = useLogout();

	function handleSignOut() {
		if (isPending) {
			return;
		}

		mutate(undefined, {
			onSuccess: () => void signOutLocally().catch((error: unknown) => reportError(error, 'sign_out')),
		});
	}

	function handleClose() {
		reset();

		onClose();
	}

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('settings.signOutDialog.title'),
				message: t('settings.signOutDialog.message'),
				confirm: t('settings.signOutDialog.confirm'),
			}}
			confirmStatus={{ busy: isPending, errorMessage: isError ? t('auth.signOutError') : null }}
			onConfirm={handleSignOut}
			onClose={handleClose}
		/>
	);
}
