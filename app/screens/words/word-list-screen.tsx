import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import type { WordsStackParamList } from '@/types/navigation';

import { getRunningSessionOptions } from '@/hooks/apis/sessions';
import { getWordListOptions } from '@/hooks/apis/words';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlusIcon } from 'lucide-react-native';

import WordList from '@/screens/words/components/word-list';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 등록한 단어 카드와 단어 추가 버튼을 보여 주고 추가 버튼을 누르면 단어 편집 화면을 여는 화면 */
const WordListScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>();

	usePrefetchQuery(getWordListOptions());
	usePrefetchQuery(getRunningSessionOptions());

	const player = useSoundPlayer();

	const addButton = (
		<IconButton icon={PlusIcon} label={t('words.list.add')} onPress={() => navigation.navigate('WordEditor', {})} />
	);

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				{/*단어 목록 제목과 단어 추가 버튼*/}
				<ScreenHeader title={t('words.list.title')} large trailing={addButton} />

				{/*재생 실패 안내와 단어 목록*/}
				<InlineError message={player.failedId ? t('common.sound.playError') : null} />
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton blockCount={4} height={84} />
				>
					<WordList player={player} />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
});

export default WordListScreen;
