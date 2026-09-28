import { useLogout } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { signOutLocally } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';

interface Props {
	visible: boolean;
	onClose: () => void;
}

/**
 * 로그아웃할지 묻고 확인을 누르면 이 기기에서 로그아웃하는 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 */
const SignOutDialog = ({ visible, onClose }: Props) => {
	const { t } = useTranslation();

	const { isPending, isError, mutate, reset } = useLogout();

	/** 로그아웃 요청과 성공 시 이 기기에서 로그아웃 */
	const handleSignOut = () => {
		if (isPending) {
			return;
		}

		mutate(undefined, {
			onSuccess: () => void signOutLocally().catch((error: unknown) => reportError(error, 'sign_out')),
		});
	};

	/** 로그아웃 실패 안내 초기화와 다이얼로그 닫기 */
	const handleClose = () => {
		reset();

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
			confirmStatus={{ busy: isPending, errorMessage: isError ? t('auth.signOutError') : null }}
			onConfirm={handleSignOut}
			onClose={handleClose}
		/>
	);
};

export default SignOutDialog;
