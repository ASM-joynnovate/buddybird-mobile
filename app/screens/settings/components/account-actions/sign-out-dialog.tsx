import { useMutation } from '@tanstack/react-query';

import { logoutMutationOptions } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { signOutToAnonymous } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';

interface Props {
	visible: boolean;
	onClose(): void;
}

export function SignOutDialog({ visible, onClose }: Props) {
	const { t } = useTranslation();

	const { isPending, isError, mutate, reset } = useMutation({
		...logoutMutationOptions(),
		onSuccess: () => signOutToAnonymous(),
		onError: (error) => reportError(error, 'sign_out'),
	});

	function handleSignOut() {
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
				title: t('settings.signOutDialog.title'),
				message: t('settings.signOutDialog.message'),
				confirm: t('settings.signOutDialog.confirm'),
			}}
			state={{ busy: isPending, error: isError ? t('auth.signOutError') : null }}
			onConfirm={handleSignOut}
			onClose={handleClose}
		/>
	);
}
