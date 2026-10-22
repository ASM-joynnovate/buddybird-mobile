import { View } from 'react-native';

import type { CommunityUser } from '@/types/apis/users';

import { useBlockUser, useUnblockUser } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import { useCommunityStore } from '@/stores/community';
import { useMessageStore } from '@/stores/message';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';
import { Toast } from '@/components/ui/toast';

interface Props {
	user: CommunityUser;
}

/**
 * 사용자 차단 확인 다이얼로그 컴포넌트
 * @param user 차단할 사용자
 */
const BlockDialog = ({ user }: Props) => {
	const { t } = useTranslation();

	const blockUser = useBlockUser();
	const unblockUser = useUnblockUser();

	const setUserToBlock = useCommunityStore((state) => state.setUserToBlock);

	const openPopup = useMessageStore((state) => state.openPopup);

	const nickname = user.nickname ?? '';

	const handleError = (error: unknown) => openPopup({ title: apiErrorMessage(error, t) });

	const handleClose = () => {
		if (blockUser.isPending) {
			return;
		}

		setUserToBlock(null);
	};

	const handleUndoBlock = () => {
		unblockUser.mutateAsync({ id: user.id }).catch(handleError);
	};

	const handleBlock = () => {
		if (blockUser.isPending) {
			return;
		}

		blockUser.mutate(
			{ id: user.id },
			{
				onSuccess: () => {
					setUserToBlock(null);

					toast.custom(
						<Toast
							message={t('community.block.done', { nickname })}
							action={{ label: t('community.block.undo'), onPress: handleUndoBlock }}
						/>,
					);
				},
				onError: handleError,
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
