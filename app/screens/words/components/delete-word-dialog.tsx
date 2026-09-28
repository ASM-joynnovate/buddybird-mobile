import type { ReactElement } from 'react';

import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';

interface Props {
	visible: boolean;
	name: string;
	deletion: { isPending: boolean; isError: boolean };
	onConfirm(): void;
	onClose(): void;
}

export function DeleteWordDialog({ visible, name, deletion, onConfirm, onClose }: Props): ReactElement {
	const { t } = useTranslation();

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('common.confirmDelete.title', { name }),
				message: t('common.confirmDelete.message'),
			}}
			state={{
				busy: deletion.isPending,
				error: deletion.isError ? t('words.editor.deleteError') : null,
			}}
			onConfirm={onConfirm}
			onClose={onClose}
		/>
	);
}
