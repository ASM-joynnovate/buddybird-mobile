import type { Word } from '@/types/apis/words';

import { useDeleteWord } from '@/hooks/apis/words';

import { useTranslation } from 'react-i18next';

import { track } from '@/services/telemetry/client';

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';

interface Props {
	visible: boolean;
	word: Pick<Word, 'id' | 'name' | 'recordings'>;
	onClose(): void;
	onDeleted: () => void;
}

export function DeleteWordDialog({ visible, word, onClose, onDeleted }: Props) {
	const { t } = useTranslation();

	const { isError, isPending, mutate, reset } = useDeleteWord();

	/** 단어 삭제 */
	const handleDeleteWord = () => {
		if (isPending) {
			return;
		}

		mutate(
			{ id: word.id },
			{
				onSuccess: () => {
					track('word_deleted', { word_id: word.id, recording_count: word.recordings.length });

					onDeleted();
				},
			},
		);
	};

	/** 삭제 확인 다이얼로그 닫기 */
	const handleClose = () => {
		reset();

		onClose();
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('common.confirmDelete.title', { name: word.name }),
				message: t('common.confirmDelete.message'),
			}}
			state={{
				busy: isPending,
				error: isError ? t('words.editor.deleteError') : null,
			}}
			onConfirm={handleDeleteWord}
			onClose={handleClose}
		/>
	);
}
