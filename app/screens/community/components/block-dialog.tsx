import { View } from 'react-native';

import type { BlockTarget } from '@/types/community';

import { useBlockUser, useUnblockUser } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import { useCommunityStore } from '@/stores/community';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';
import { dialogToasterId, Toast } from '@/components/ui/toast';

interface Props {
	blockTarget: BlockTarget;
}

/**
 * 사용자 차단 확인 다이얼로그 컴포넌트
 * @param blockTarget 차단할 사용자
 */
const BlockDialog = ({ blockTarget }: Props) => {
	const { t } = useTranslation();

	const blockUser = useBlockUser();
	const unblockUser = useUnblockUser();

	const setBlockTarget = useCommunityStore((state) => state.setBlockTarget);

	const nickname = blockTarget.nickname ?? '';

	const handleClose = () => {
		if (blockUser.isPending) {
			return;
		}

		setBlockTarget(null);
	};

	const handleUndoBlock = () => {
		unblockUser.mutateAsync({ id: blockTarget.userId }).catch((error: unknown) => {
			toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />);
		});
	};

	const handleBlock = () => {
		if (blockUser.isPending) {
			return;
		}

		blockUser.mutate(
			{ id: blockTarget.userId },
			{
				onSuccess: () => {
					setBlockTarget(null);

					toast.custom(
						<Toast
							message={t('community.block.done', { nickname })}
							action={{ label: t('community.block.undo'), onPress: handleUndoBlock }}
						/>,
					);
				},
				onError: (error) => {
					toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />, {
						toasterId: dialogToasterId,
					});
				},
			},
		);
	};

	return (
		<Dialog
			visible
			onClose={handleClose}
			title={t('community.block.title', { nickname })}
			footer={
				<View style={ui.actionsRow}>
					<Button
						label={t('common.cancel')}
						variant="secondary"
						size="small"
						disabled={blockUser.isPending}
						depth="high"
						onPress={handleClose}
						style={ui.action}
					/>
					<Button
						label={t('community.block.action')}
						variant="danger"
						size="small"
						loading={blockUser.isPending}
						depth="high"
						onPress={handleBlock}
						style={ui.action}
					/>
				</View>
			}
		>
			<Copy>{t('community.block.message')}</Copy>
		</Dialog>
	);
};

export default BlockDialog;
