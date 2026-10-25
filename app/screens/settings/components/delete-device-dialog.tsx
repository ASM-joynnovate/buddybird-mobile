import type { LinkedDevice } from '@/types/device';

import { useDeleteDevice } from '@/hooks/apis/devices';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Copy } from '@/components/ui/copy';
import { dialogToasterId, Toast } from '@/components/ui/toast';

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

	const { isPending, mutate } = useDeleteDevice();

	const handleDeleteDevice = () => {
		if (isPending) {
			return;
		}

		mutate(
			{ id: device.id },
			{
				onSuccess: onClose,
				onError: () => {
					toast.custom(<Toast variant="error" message={t('settings.devices.deleteError')} />, {
						toasterId: dialogToasterId,
					});
				},
			},
		);
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('common.confirmDelete.title', { name: device.model }),
				message: t('settings.devices.deleteMessage'),
			}}
			confirmBusy={isPending}
			onConfirm={handleDeleteDevice}
			onClose={onClose}
		>
			{device.isRunningSession && <Copy>{t('settings.devices.sessionEnds')}</Copy>}
		</ConfirmDialog>
	);
};

export default DeleteDeviceDialog;
