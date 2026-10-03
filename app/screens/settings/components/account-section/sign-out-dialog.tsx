import { useLogout, useSignOutLocally } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';

interface Props {
	visible: boolean;
	onClose: () => void;
}

/**
 * 로그아웃 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 */
const SignOutDialog = ({ visible, onClose }: Props) => {
	const { t } = useTranslation();

	const logout = useLogout();
	const signOutLocally = useSignOutLocally();

	const signOutPending = logout.isPending || signOutLocally.isPending;

	const handleSignOut = () => {
		if (signOutPending) {
			return;
		}

		logout.mutate(undefined, { onSuccess: () => signOutLocally.mutate() });
	};

	const handleClose = () => {
		logout.reset();
		signOutLocally.reset();

		onClose();
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('settings.signOutDialog.title'),
				message: t('settings.signOutDialog.message'),
				confirm: t('settings.signOutDialog.confirm'),
			}}
			confirmStatus={{ busy: signOutPending, errorMessage: logout.isError ? t('auth.signOutError') : null }}
			onConfirm={handleSignOut}
			onClose={handleClose}
		/>
	);
};

export default SignOutDialog;
