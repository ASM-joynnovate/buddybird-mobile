import type { Word } from '@/types/apis/words';

import { useDeleteWord } from '@/hooks/apis/words';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import { track } from '@/services/telemetry/client';
import { uploadedRecordings } from '@/utils/uploaded-recordings';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { dialogToasterId, Toast } from '@/components/ui/toast';

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

	const { isPending, mutate } = useDeleteWord();

	const handleDeleteWord = () => {
		if (isPending) {
			return;
		}

		mutate(
			{ id: word.id },
			{
				onSuccess: () => {
					track('word_deleted', {
						word_id: word.id,
						recording_count: uploadedRecordings(word.recordings).length,
					});

					onDeleted();
				},
				onError: () => {
					toast.custom(<Toast variant="error" message={t('words.deleteError')} />, {
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
				title: t('common.confirmDelete.title', { name: word.name }),
				message: t('common.confirmDelete.message'),
			}}
			confirmBusy={isPending}
			onConfirm={handleDeleteWord}
			onClose={onClose}
		/>
	);
};

export default DeleteWordDialog;
