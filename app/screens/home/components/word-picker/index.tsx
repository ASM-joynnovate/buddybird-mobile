import { useState } from 'react';

import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';

import type { Word } from '@/types/apis/words';

import WordChoice from '@/screens/home/components/word-picker/word-choice';
import { colors } from '@/theme';

const LIST_MAX_HEIGHT_RATIO = 0.45;
const EDGE_TOLERANCE = 8;

interface Props {
	words: readonly Word[];
	selectedId: string | null;
	onSelect: (id: string) => void;
}

/**
 * 단어 선택 목록 컴포넌트
 * @param words 선택할 수 있는 단어 목록
 * @param selectedId 선택한 단어 ID
 * @param onSelect 단어 선택 시 실행할 함수
 */
const WordPicker = ({ words, selectedId, onSelect }: Props) => {
	const { height } = useWindowDimensions();

	const [scrollEdges, setScrollEdges] = useState({ top: true, bottom: false });
	const [contentHeight, setContentHeight] = useState(0);
	const [viewportHeight, setViewportHeight] = useState(0);

	const scrollable = contentHeight > viewportHeight + 1;

	/** 스크롤 위치가 목록 끝인지 저장 */
	const handleScroll = ({
		nativeEvent: { contentOffset, contentSize, layoutMeasurement },
	}: NativeSyntheticEvent<NativeScrollEvent>) => {
		const top = contentOffset.y <= EDGE_TOLERANCE;
		const bottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - EDGE_TOLERANCE;

		setScrollEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
	};

	return (
		<View>
			<ScrollView
				nestedScrollEnabled
				persistentScrollbar
				scrollEventThrottle={16}
				onScroll={handleScroll}
				onLayout={({ nativeEvent }) => setViewportHeight(nativeEvent.layout.height)}
				onContentSizeChange={(_width, nextHeight) => setContentHeight(nextHeight)}
				style={[styles.listContainer, { maxHeight: height * LIST_MAX_HEIGHT_RATIO }]}
				contentContainerStyle={styles.wordsRow}
			>
				{words.map((word) => (
					<View key={word.id} style={styles.wordContainer}>
						<WordChoice word={word} selected={word.id === selectedId} onSelect={onSelect} />
					</View>
				))}
			</ScrollView>

			{/*위아래 흐림 효과*/}
			{scrollable && !scrollEdges.top && <View pointerEvents="none" style={[styles.fade, styles.fadeTop]} />}
			{scrollable && !scrollEdges.bottom && (
				<View pointerEvents="none" style={[styles.fade, styles.fadeBottom]} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	listContainer: { marginHorizontal: -4 },
	wordsRow: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
	wordContainer: { width: '33.333333%', paddingHorizontal: 4 },
	fade: { position: 'absolute', left: 0, right: 0, height: '18%', maxHeight: 56 },
	fadeTop: {
		top: 0,
		experimental_backgroundImage: `linear-gradient(to bottom, ${colors.background}, ${colors.backgroundTransparent})`,
	},
	fadeBottom: {
		bottom: 0,
		experimental_backgroundImage: `linear-gradient(to bottom, ${colors.backgroundTransparent}, ${colors.background})`,
	},
});

export default WordPicker;
