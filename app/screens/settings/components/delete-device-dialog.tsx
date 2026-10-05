import type { LinkedDevice } from '@/types/device';

import { useDeleteDevice } from '@/hooks/apis/devices';

import { useTranslation } from 'react-i18next';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Copy } from '@/components/ui/copy';

interface Props {
	visible: boolean;
	device: LinkedDevice;
	onClose: () => void;
}

/**
 * 기기 삭제 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param device 삭제할 기기
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 */
const DeleteDeviceDialog = ({ visible, device, onClose }: Props) => {
	const { t } = useTranslation();

	const { isError, isPending, mutate, reset } = useDeleteDevice();

	const handleDeleteDevice = () => {
		if (isPending) {
			return;
		}

		mutate({ id: device.id }, { onSuccess: onClose });
	};

	const handleClose = () => {
		reset();

		onClose();
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('common.confirmDelete.title', { name: device.model }),
				message: t('settings.devices.deleteMessage'),
			}}
			confirmStatus={{
				busy: isPending,
				errorMessage: isError ? t('settings.devices.deleteError') : null,
			}}
			onConfirm={handleDeleteDevice}
			onClose={handleClose}
		>
			{device.isRunningSession && <Copy>{t('settings.devices.sessionEnds')}</Copy>}
		</ConfirmDialog>
	);
};

export default DeleteDeviceDialog;
