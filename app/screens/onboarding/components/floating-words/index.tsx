import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet } from 'react-native';

import Animated, { FadeOut, useReducedMotion } from 'react-native-reanimated';

import FloatingWordsItem, { type FloatingWordPath } from '@/screens/onboarding/components/floating-words/item';
import { contentMaxWidth } from '@/theme';
import { SECOND } from '@/utils/units';

const START_DELAY_MS = SECOND;
const STAGGER_MS = 1.2 * SECOND;
const STILL_WORD_COUNT = 3;

const PATHS: FloatingWordPath[] = [
	{ start: 0.12, end: 0.23, tilt: -4, still: { x: 0.16, rise: 0.55 } },
	{ start: 0.23, end: 0.72, tilt: 3, still: { x: 0.68, rise: 0.8 } },
	{ start: 0.11, end: 0.43, tilt: -2, still: { x: 0.85, rise: 0.4 } },
	{ start: 0.2, end: 0.87, tilt: 5, still: null },
	{ start: 0.14, end: 0.21, tilt: -5, still: null },
];

interface Props {
	words: string[];
	active: boolean;
	riseHeight: number;
}

/**
 * 앵무새에게 가르칠 단어가 차례로 떠오르는 컴포넌트
 * @param words 떠오를 단어 목록
 * @param active 움직임 실행 여부
 * @param riseHeight 떠오르는 높이
 */
const FloatingWords = ({ words, active, riseHeight }: Props) => {
	const reducedMotion = useReducedMotion();

	const [areaWidth, setAreaWidth] = useState(0);

	if (!active) {
		return null;
	}

	const shownWords = words.slice(0, reducedMotion ? STILL_WORD_COUNT : PATHS.length);

	const handleLayout = (event: LayoutChangeEvent) => {
		setAreaWidth(event.nativeEvent.layout.width);
	};

	return (
		<Animated.View
			exiting={FadeOut}
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			onLayout={handleLayout}
			style={styles.container}
		>
			{areaWidth > 0 &&
				shownWords.map((word, index) => (
					<FloatingWordsItem
						key={word}
						word={word}
						path={PATHS[index]}
						delay={START_DELAY_MS + index * STAGGER_MS}
						riseHeight={riseHeight}
						areaWidth={areaWidth}
					/>
				))}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 24,
		width: '100%',
		maxWidth: contentMaxWidth,
	},
});

export default FloatingWords;
