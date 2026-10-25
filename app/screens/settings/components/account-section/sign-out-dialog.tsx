import { useLogout } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import useSignOutLocally from '@/screens/settings/hooks/use-sign-out-locally';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { dialogToasterId, Toast } from '@/components/ui/toast';

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

		logout.mutate(undefined, {
			onSuccess: () => signOutLocally.mutate(),
			onError: () => {
				toast.custom(<Toast variant="error" message={t('auth.signOutError')} />, {
					toasterId: dialogToasterId,
				});
			},
		});
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('settings.signOutDialog.title'),
				message: t('settings.signOutDialog.message'),
				confirm: t('settings.signOutDialog.confirm'),
			}}
			confirmBusy={signOutPending}
			onConfirm={handleSignOut}
			onClose={onClose}
		/>
	);
};

export default SignOutDialog;
