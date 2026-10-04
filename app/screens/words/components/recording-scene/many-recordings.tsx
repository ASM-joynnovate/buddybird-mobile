import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChartColumnIcon, CheckIcon, PlayIcon } from 'lucide-react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { colors, font, radius } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const RECORDINGS = [
	{ order: 1, left: 56, top: 318, tilt: 2, waveStart: 0, appearOrder: 2 },
	{ order: 2, left: 48, top: 234, tilt: -3, waveStart: 5, appearOrder: 6 },
	{ order: 3, left: 60, top: 150, tilt: 3, waveStart: 9, appearOrder: 10 },
];
const REPORT_BARS = [
	{ heightRatio: 0.35, delayMs: 370 },
	{ heightRatio: 0.65, delayMs: 650 },
	{ heightRatio: 1, delayMs: 930 },
];
const CHECK_APPEAR_ORDER = 15;
const WAVE_LEVELS = [0.35, 0.7, 0.45, 0.9, 0.55, 1, 0.6, 0.4, 0.8, 0.5, 0.95, 0.55, 0.85, 0.4, 0.7, 0.35];
const WAVE_BAR_COUNT = 12;
const BAR_GROW_MS = 400;

/**
 * 막대가 아래부터 자라는 애니메이션
 * @param delayMs 시작 전 기다리는 시간
 */
const growUp = (delayMs: number) => {
	return new Keyframe({
		0: { transform: [{ scaleY: 0.2 }] },
		100: { transform: [{ scaleY: 1 }], easing: Easing.out(Easing.back(2)) },
	})
		.duration(BAR_GROW_MS)
		.delay(delayMs);
};

interface Props {
	scale: number;
}

/**
 * 녹음이 늘 때마다 리포트 그래프가 차오르는 장면 컴포넌트
 * @param scale 그림 배율
 */
const RecordingSceneManyRecordings = ({ scale }: Props) => {
	const { t } = useTranslation();

	const cardShape = { borderRadius: 18 * scale };

	return (
		<>
			{/*리포트 그래프*/}
			<Animated.View entering={popIn(0)} style={[styles.sceneItem, { left: 197 * scale, top: 8 * scale }]}>
				<View style={[styles.cardEdge, cardShape, { width: 150 * scale, paddingBottom: 4 * scale }]}>
					<View style={[styles.card, cardShape, { padding: 12 * scale }]}>
						<View style={[styles.reportTitleRow, { gap: 6 * scale }]}>
							<ChartColumnIcon size={18 * scale} color={colors.orange} />
							<Copy style={[styles.reportTitle, { fontSize: 13 * scale, lineHeight: 18 * scale }]}>
								{t('words.guide.manyRecordings.report')}
							</Copy>
						</View>

						<View
							style={[
								styles.chart,
								{
									height: 44 * scale,
									marginTop: 10 * scale,
									gap: 8 * scale,
									paddingHorizontal: 4 * scale,
								},
							]}
						>
							{REPORT_BARS.map(({ heightRatio, delayMs }) => (
								<Animated.View
									key={delayMs}
									entering={growUp(delayMs)}
									style={[
										styles.reportBar,
										{
											height: `${heightRatio * 100}%`,
											borderTopLeftRadius: 6 * scale,
											borderTopRightRadius: 6 * scale,
										},
									]}
								/>
							))}
						</View>
					</View>
				</View>

				<Animated.View
					entering={popIn(CHECK_APPEAR_ORDER)}
					style={[
						styles.checkBadge,
						{
							right: -10 * scale,
							top: -10 * scale,
							width: 30 * scale,
							height: 30 * scale,
							borderBottomWidth: 3 * scale,
						},
					]}
				>
					<CheckIcon size={18 * scale} color={colors.onFilled} strokeWidth={3} />
				</Animated.View>
			</Animated.View>

			{/*녹음 카드*/}
			{RECORDINGS.map(({ order, left, top, tilt, waveStart, appearOrder }) => (
				<Animated.View
					key={order}
					entering={popIn(appearOrder)}
					style={[styles.sceneItem, { left: left * scale, top: top * scale }]}
				>
					<View
						style={[
							styles.cardEdge,
							cardShape,
							{ width: 264 * scale, paddingBottom: 4 * scale, transform: [{ rotate: `${tilt}deg` }] },
						]}
					>
						<View
							style={[
								styles.card,
								styles.recordingRow,
								cardShape,
								{ height: 70 * scale, gap: 12 * scale, paddingHorizontal: 14 * scale },
							]}
						>
							<View
								style={[
									styles.playButtonEdge,
									{ width: 44 * scale, height: 44 * scale, paddingBottom: 4 * scale },
								]}
							>
								<View style={styles.playButton}>
									<PlayIcon size={18 * scale} color={colors.onFilled} fill={colors.onFilled} />
								</View>
							</View>

							<Copy style={[styles.wordText, { fontSize: 18 * scale, lineHeight: 24 * scale }]}>
								{t('words.guide.word')}
							</Copy>

							<View style={[styles.waveRow, { height: 28 * scale, gap: 3 * scale }]}>
								{Array.from({ length: WAVE_BAR_COUNT }, (_, index) => (
									<View
										key={index}
										style={[
											styles.waveBar,
											{
												width: 4 * scale,
												height:
													WAVE_LEVELS[(index + waveStart) % WAVE_LEVELS.length] * 26 * scale,
											},
										]}
									/>
								))}
							</View>

							<View
								style={[styles.orderTag, { paddingHorizontal: 8 * scale, paddingVertical: 1 * scale }]}
							>
								<Copy style={[styles.orderText, { fontSize: 12 * scale, lineHeight: 16 * scale }]}>
									{t('words.guide.manyRecordings.recordingOrder', { order })}
								</Copy>
							</View>
						</View>
					</View>
				</Animated.View>
			))}
		</>
	);
};

const styles = StyleSheet.create({
	sceneItem: { position: 'absolute' },
	cardEdge: { borderCurve: 'continuous', backgroundColor: colors.border },
	card: {
		borderWidth: 2,
		borderColor: colors.border,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	reportTitleRow: { flexDirection: 'row', alignItems: 'center' },
	reportTitle: { fontFamily: font.extraBold, color: colors.text },
	chart: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: colors.border },
	reportBar: { flex: 1, transformOrigin: 'bottom', backgroundColor: colors.orange },
	checkBadge: {
		position: 'absolute',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		borderBottomColor: colors.greenDark,
		backgroundColor: colors.green,
	},
	recordingRow: { flexDirection: 'row', alignItems: 'center' },
	playButtonEdge: { borderRadius: radius.pill, backgroundColor: colors.orangeDark },
	playButton: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
	},
	wordText: { fontFamily: font.black, color: colors.text },
	waveRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
	waveBar: { borderRadius: radius.pill, backgroundColor: colors.orangeSoft },
	orderTag: {
		borderWidth: 2,
		borderColor: colors.orangeSoft,
		borderRadius: radius.pill,
		backgroundColor: colors.orangePale,
	},
	orderText: { fontFamily: font.extraBold, color: colors.orangeDark },
});

export default RecordingSceneManyRecordings;
