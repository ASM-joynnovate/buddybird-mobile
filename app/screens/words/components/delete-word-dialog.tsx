import type { Word } from '@/types/apis/words';

import { useDeleteWord } from '@/hooks/apis/words';

import { useTranslation } from 'react-i18next';

import { track } from '@/services/telemetry/client';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';

interface Props {
	visible: boolean;
	word: Pick<Word, 'id' | 'name' | 'recordings'>;
	onClose: () => void;
	onDeleted: () => void;
}

/**
 * 단어 삭제 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param word 삭제할 단어
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 * @param onDeleted 단어 삭제 후 실행할 함수
 */
const DeleteWordDialog = ({ visible, word, onClose, onDeleted }: Props) => {
	const { t } = useTranslation();

	const { isError, isPending, mutate, reset } = useDeleteWord();

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
			confirmStatus={{
				busy: isPending,
				errorMessage: isError ? t('words.deleteError') : null,
			}}
			onConfirm={handleDeleteWord}
			onClose={handleClose}
		/>
	);
};

export default DeleteWordDialog;
