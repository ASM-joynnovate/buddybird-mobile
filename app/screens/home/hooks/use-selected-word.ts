import { useGetWordList } from '@/hooks/apis/words';

import { useSessionStore } from '@/stores/session';
import { uploadedRecordings } from '@/utils/uploaded-recordings';

/** 학습할 수 있는 단어 목록 및 선택한 단어 Hook */
const useSelectedWord = () => {
	const { data: wordListData } = useGetWordList();

	const selectedWordId = useSessionStore((state) => state.selectedWordId);

	const wordsWithRecordings = wordListData.filter((word) => uploadedRecordings(word.recordings).length > 0);
	const selectedWord =
		wordsWithRecordings.find((word) => word.id === selectedWordId) ?? wordsWithRecordings[0] ?? null;

	return { wordsWithRecordings, selectedWord };
};

export default useSelectedWord;
