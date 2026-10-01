import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import type { WordsStackParamList } from '@/types/navigation';

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

/** 단어 목록 화면 */
const WordListScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<WordsStackParamList>>();

	usePrefetchQuery(getWordListOptions());

	const player = useSoundPlayer();

	const addButton = (
		<IconButton
			icon={PlusIcon}
			label={t('words.list.add')}
			variant="primary"
			shape="square"
			onPress={() => navigation.navigate('WordEditor', {})}
		/>
	);

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ScreenHeader title={t('words.list.title')} large trailing={addButton} />

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
