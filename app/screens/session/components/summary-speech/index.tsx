import { useCallback, useEffect, useState } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useGetParrotList } from '@/hooks/apis/parrots';
import { useGetSession, useGetSessionSummary } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import Animated, {
	type MeasuredDimensions,
	useAnimatedStyle,
	useSharedValue,
	withSequence,
	withTiming,
} from 'react-native-reanimated';

import { bounceEasing, popIn, riseIn } from '@/screens/session/components/summary-animations';
import SummarySpeechFillingNumber, {
	type SummarySentence,
} from '@/screens/session/components/summary-speech/filling-number';
import { useSessionStore } from '@/stores/session';
import { font } from '@/theme';
import { sessionEndedAt } from '@/utils/date';
import { SECOND } from '@/utils/units';

import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';
import { PageDots } from '@/components/ui/page-dots';
import { SpeechBubble } from '@/components/ui/speech-bubble';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const BUBBLE_DELAY_MS = 500;
const FIRST_SENTENCE_DELAY_MS = 700;
const SENTENCE_MS = 2.5 * SECOND;
const HOP_RATIO = 0.12;
const HOP_SCALE = 0.04;

interface Props {
	sessionId: string;
	mascotSize: number;
}

/**
 * 버디가 학습 결과를 한 문장씩 말하는 컴포넌트
 * @param sessionId 세션 ID
 * @param mascotSize 마스코트 크기
 */
const SummarySpeech = ({ sessionId, mascotSize }: Props) => {
	const { t } = useTranslation();

	const { width, height } = useWindowDimensions();

	const hop = useSharedValue(0);

	const [sentenceVisible, setSentenceVisible] = useState(false);

	const { data: sessionSummaryData } = useGetSessionSummary({ id: sessionId });
	const { data: sessionData } = useGetSession({ id: sessionId });
	const { data: parrotListData } = useGetParrotList();

	const summarySentenceIndex = useSessionStore((state) => state.summarySentenceIndex);
	const summaryFilledSentenceIndexes = useSessionStore((state) => state.summaryFilledSentenceIndexes);
	const summaryAutoAdvanceStopped = useSessionStore((state) => state.summaryAutoAdvanceStopped);
	const setSummarySentenceIndex = useSessionStore((state) => state.setSummarySentenceIndex);
	const completeSummarySentence = useSessionStore((state) => state.completeSummarySentence);
	const moveSummarySentence = useSessionStore((state) => state.moveSummarySentence);

	const isLandscape = width > height;
	const { word, session, total } = sessionSummaryData;
	const { period } = sessionData;
	const firstParrotName = parrotListData[0]?.name ?? '';
	const parrotName =
		parrotListData.length > 1
			? t('session.summary.parrots', { name: firstParrotName, count: parrotListData.length - 1 })
			: firstParrotName;
	const togetherSentence: SummarySentence = {
		lead: t('session.summary.together.lead', { parrot: parrotName }),
		tail: t('session.summary.together.tail', { parrot: parrotName }),
		value: sessionEndedAt(period).diff(period.started_at),
		unit: 'duration',
		metric: 'together',
	};
	const allTimeSentence: SummarySentence = {
		lead: t('session.summary.allTime.lead'),
		tail: t('session.summary.allTime.tail'),
		value: total.learning_duration_ms,
		unit: 'duration',
		metric: 'allTime',
	};
	const sentences: SummarySentence[] = word
		? [
				togetherSentence,
				{
					lead: t('session.summary.played.lead', { word: word.name }),
					tail: t('session.summary.played.tail'),
					value: session.play_count,
					unit: 'count',
					metric: 'played',
				},
				allTimeSentence,
				{
					lead: t('session.summary.wordTime.lead', { word: word.name }),
					tail: t('session.summary.wordTime.tail'),
					value: total.word_learning_duration_ms ?? 0,
					unit: 'duration',
					metric: 'wordTime',
				},
			]
		: [togetherSentence, allTimeSentence];
	const lastIndex = sentences.length - 1;
	const sentence = sentences[summarySentenceIndex];
	const sentenceFilled = summaryFilledSentenceIndexes.includes(summarySentenceIndex);
	const hopStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: -mascotSize * HOP_RATIO * hop.get() }, { scale: 1 + HOP_SCALE * hop.get() }],
	}));

	/** 말풍선이 나타난 뒤 첫 문장 표시 */
	useEffect(() => {
		const timer = setTimeout(() => setSentenceVisible(true), FIRST_SENTENCE_DELAY_MS);

		return () => clearTimeout(timer);
	}, []);

	/** 사용자가 직접 넘기지 않았으면 마지막 문장까지 일정 시간마다 다음 문장 표시 */
	useEffect(() => {
		if (!sentenceVisible || summaryAutoAdvanceStopped || summarySentenceIndex >= lastIndex) {
			return;
		}

		const timer = setTimeout(() => setSummarySentenceIndex(summarySentenceIndex + 1), SENTENCE_MS);

		return () => clearTimeout(timer);
	}, [lastIndex, sentenceVisible, setSummarySentenceIndex, summaryAutoAdvanceStopped, summarySentenceIndex]);

	const handleCompleteSentence = useCallback(
		(position: MeasuredDimensions | null) => {
			completeSummarySentence(summarySentenceIndex, position);

			hop.set(
				withSequence(
					withTiming(1, { duration: 180, easing: bounceEasing }),
					withTiming(0, { duration: 270, easing: bounceEasing }),
				),
			);
		},
		[completeSummarySentence, hop, summarySentenceIndex],
	);

	const handleShowNextSentence = () => {
		if (summarySentenceIndex >= lastIndex) {
			return;
		}

		moveSummarySentence(summarySentenceIndex + 1);
	};

	const handleShowPreviousSentence = () => {
		if (summarySentenceIndex === 0) {
			return;
		}

		moveSummarySentence(summarySentenceIndex - 1);
	};

	return (
		<View style={styles.container}>
			<Animated.View entering={riseIn().delay(BUBBLE_DELAY_MS)} style={styles.bubbleContainer}>
				<SpeechBubble contentStyle={styles.bubble}>
					<PressableSurface
						variant="plain"
						depth="none"
						cornerRadius="none"
						contentStyle={[styles.sentencePressable, isLandscape && styles.sentencePressableLandscape]}
						onPress={handleShowNextSentence}
						onSwipeLeft={handleShowNextSentence}
						onSwipeRight={handleShowPreviousSentence}
						accessibilityRole="button"
					>
						{sentenceVisible && (
							<Animated.View
								key={summarySentenceIndex}
								entering={riseIn()}
								style={styles.sentenceContainer}
							>
								<Copy style={[styles.sentenceText, isLandscape && styles.sentenceTextLandscape]}>
									{sentence.lead}
								</Copy>

								<SummarySpeechFillingNumber
									sentence={sentence}
									size={isLandscape ? 'medium' : 'large'}
									filled={sentenceFilled}
									onFilled={handleCompleteSentence}
								/>

								<Copy style={[styles.sentenceText, isLandscape && styles.sentenceTextLandscape]}>
									{sentence.tail}
								</Copy>
							</Animated.View>
						)}
					</PressableSurface>

					<PageDots
						count={sentences.length}
						currentIndex={summarySentenceIndex}
						label={t('session.summary.sentenceProgress', {
							current: summarySentenceIndex + 1,
							total: sentences.length,
						})}
					/>
				</SpeechBubble>
			</Animated.View>

			<Animated.View entering={popIn()}>
				<Animated.View style={hopStyle}>
					<Mascot size={mascotSize} />
				</Animated.View>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 16 },
	bubbleContainer: { alignSelf: 'stretch' },
	bubble: { paddingVertical: 16, paddingHorizontal: 20, gap: 8 },
	sentencePressable: { minHeight: 104, justifyContent: 'center', borderWidth: 0 },
	sentencePressableLandscape: { minHeight: 88 },
	sentenceContainer: { alignItems: 'center', gap: 4 },
	sentenceText: { fontFamily: font.extraBold, fontSize: 18, lineHeight: 24, textAlign: 'center' },
	sentenceTextLandscape: { fontSize: 16, lineHeight: 20 },
});

export default SummarySpeech;
