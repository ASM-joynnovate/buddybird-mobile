import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { PINNED_BAND_HEIGHT } from '@/screens/report/components/recorder/pinned';
import type { RowLayout } from '@/screens/report/components/tape-log/row';
import TapeReel from '@/screens/report/components/tape-reel';
import { colors, font } from '@/theme';
import type { TimeSpan } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

const TAPE_COLORS = {
	groove: '#2e2e2e',
	highlight: '#686868',
	shadow: '#1c1c1c',
	sleepLight: '#6a6a6a',
	sleepDark: '#4a4a4a',
};

const REEL_SIZE = 34;
const RIBBON_HEIGHT = 14;
const RIBBON_SHADE = 4;
const FEED_FULL_RADIUS = 34;
const TAKE_EMPTY_RADIUS = 15;
const WOUND_RADIUS = 19;

export interface StickyLayout {
	y: number;
	height: number;
}

interface Props {
	span: TimeSpan;
	running: boolean;
	sleepSpans: TimeSpan[];
	midnights: number[];
	playing: boolean;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logY: SharedValue<number>;
	rowLayouts: SharedValue<RowLayout[]>;
	dayBreakLayouts: SharedValue<StickyLayout[]>;
	stripLayout: SharedValue<StickyLayout>;
}

/**
 * 스크롤만큼 감기는 가로 테이프 컴포넌트
 * @param span 세션 시작 및 종료 시각
 * @param running 진행 중인 세션인지 여부
 * @param sleepSpans 수면 구간 목록
 * @param midnights 자정 시각 목록
 * @param playing 재생 중 여부
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logY 테이프 기록 위치
 * @param rowLayouts 행 위치 목록
 * @param dayBreakLayouts 날짜 띠 위치 목록
 * @param stripLayout 가로 테이프 위치를 저장할 값
 */
const TapeLogStrip = ({
	span,
	running,
	sleepSpans,
	midnights,
	playing,
	scrollY,
	viewportHeight,
	logY,
	rowLayouts,
	dayBreakLayouts,
	stripLayout,
}: Props) => {
	const { t } = useTranslation();

	const ribbonWidth = useSharedValue(0);

	const duration = Math.max(span.end - span.start, 1);
	const percentOf = (time: number) => ((time - span.start) / duration) * 100;

	// 화면 아래 행의 시각까지 감긴 비율
	const progress = useDerivedValue(() => {
		const reach = scrollY.get() + viewportHeight.get() - logY.get();
		let time = span.start;

		for (const row of rowLayouts.get()) {
			if (!row || row.y > reach) {
				continue;
			}

			time = row.start + Math.min((reach - row.y) / Math.max(row.height, 1), 1) * (row.end - row.start);
		}

		return Math.min(Math.max((time - span.start) / duration, 0), 1);
	});
	const feedRadius = useDerivedValue(() => FEED_FULL_RADIUS - WOUND_RADIUS * progress.get());
	const takeRadius = useDerivedValue(() => TAKE_EMPTY_RADIUS + WOUND_RADIUS * progress.get());
	const stickyStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateY: Math.max(scrollY.get() + PINNED_BAND_HEIGHT - (logY.get() + stripLayout.get().y), 0) },
		],
	}));
	const progressStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: progress.get() * ribbonWidth.get() }],
	}));
	const stuckLineStyle = useAnimatedStyle(() => {
		const strip = stripLayout.get();
		const firstDayBreak = dayBreakLayouts.get().at(0);
		const stripStuck = scrollY.get() + PINNED_BAND_HEIGHT >= logY.get() + strip.y;
		const dayBreakStuck =
			firstDayBreak !== undefined &&
			logY.get() + firstDayBreak.y - scrollY.get() <= PINNED_BAND_HEIGHT + strip.height + 0.5;

		return { opacity: stripStuck && !dayBreakStuck ? 1 : 0 };
	});

	return (
		<Animated.View
			style={[styles.strip, stickyStyle]}
			onLayout={(event) =>
				stripLayout.set({ y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height })
			}
		>
			<View style={styles.ends}>
				<Copy style={styles.end}>
					{t('report.detail.start')} <Copy style={styles.endTime}>{dayjs(span.start).format('LT')}</Copy>
				</Copy>
				<Copy style={styles.end}>
					{t(running ? 'report.detail.now' : 'report.detail.end')}{' '}
					<Copy style={styles.endTime}>{dayjs(span.end).format('LT')}</Copy>
				</Copy>
			</View>

			<View style={styles.deck}>
				<View style={styles.reel}>
					<TapeReel size={REEL_SIZE} side="left" radius={feedRadius} scrollY={scrollY} playing={playing} />
				</View>

				<View style={styles.ribbon} onLayout={(event) => ribbonWidth.set(event.nativeEvent.layout.width)}>
					<Svg width="100%" height={RIBBON_HEIGHT}>
						<Defs>
							<Pattern id="tape" width="9" height={RIBBON_HEIGHT} patternUnits="userSpaceOnUse">
								<Rect width="7" height={RIBBON_HEIGHT} fill={colors.text} />
								<Rect x="7" width="2" height={RIBBON_HEIGHT} fill={TAPE_COLORS.groove} />
							</Pattern>
							<Pattern
								id="sleep"
								width="8"
								height="8"
								patternUnits="userSpaceOnUse"
								patternTransform="rotate(45)"
							>
								<Rect width="4" height="8" fill={TAPE_COLORS.sleepLight} />
								<Rect x="4" width="4" height="8" fill={TAPE_COLORS.sleepDark} />
							</Pattern>
						</Defs>
						<Rect width="100%" height={RIBBON_HEIGHT} fill="url(#tape)" />
						<Rect width="100%" height={RIBBON_SHADE} fill={TAPE_COLORS.highlight} />
						<Rect
							y={RIBBON_HEIGHT - RIBBON_SHADE}
							width="100%"
							height={RIBBON_SHADE}
							fill={TAPE_COLORS.shadow}
						/>
						{sleepSpans.map((sleepSpan) => (
							<Rect
								key={sleepSpan.start}
								x={`${percentOf(sleepSpan.start)}%`}
								width={`${percentOf(sleepSpan.end) - percentOf(sleepSpan.start)}%`}
								height={RIBBON_HEIGHT}
								fill="url(#sleep)"
							/>
						))}
					</Svg>

					{/*감긴 만큼 왼쪽에서 밀려 나오는 오렌지 선*/}
					<View style={styles.progressClip}>
						<Animated.View style={[styles.progress, progressStyle]} />
					</View>

					{/*자정의 흰 이음 테이프*/}
					{midnights.map((midnight) => (
						<View key={midnight} style={[styles.splice, { left: `${percentOf(midnight)}%` }]} />
					))}
				</View>

				<View style={styles.reel}>
					<TapeReel size={REEL_SIZE} side="right" radius={takeRadius} scrollY={scrollY} playing={playing} />
				</View>
			</View>

			<Animated.View style={[styles.stuckLine, stuckLineStyle]} />
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	strip: {
		zIndex: 2,
		marginHorizontal: -24,
		marginBottom: 10,
		paddingTop: 4,
		paddingHorizontal: 24,
		paddingBottom: 10,
		backgroundColor: colors.background,
	},
	ends: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
	end: {
		fontFamily: font.extraBold,
		fontSize: 12,
		lineHeight: 16,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	endTime: { fontFamily: font.black, color: colors.text },
	deck: { flexDirection: 'row', alignItems: 'center' },
	reel: { zIndex: 1 },
	ribbon: { flex: 1, height: RIBBON_HEIGHT, marginHorizontal: -6, overflow: 'visible', borderRadius: 2 },
	progressClip: {
		position: 'absolute',
		top: 5,
		right: 0,
		left: 0,
		height: 4,
		overflow: 'hidden',
		borderRadius: 2,
	},
	progress: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: '-100%',
		width: '100%',
		borderRadius: 2,
		backgroundColor: colors.orange,
	},
	splice: {
		position: 'absolute',
		top: -4,
		width: 11,
		height: 22,
		marginLeft: -6,
		borderRadius: 2,
		borderWidth: 2,
		borderColor: colors.text,
		backgroundColor: colors.background,
		transform: [{ rotate: '-9deg' }],
	},
	stuckLine: {
		position: 'absolute',
		right: 0,
		bottom: -2,
		left: 0,
		height: 2,
		backgroundColor: colors.surface,
	},
});

export default TapeLogStrip;
