import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Phase } from '@/types/apis/sessions';

import Svg, { Path } from 'react-native-svg';

import { sessionColors, sessionPhaseColors } from '@/theme/session-colors';

const STROKE_WIDTH = 16;

type ArcVariant = 'half' | 'full';

interface Props {
	width: number;
	variant: ArcVariant;
	phase: Phase;
	progressRatio: number | null;
	children: ReactNode;
}

/**
 * 진행한 만큼 채워지는 반원 또는 원 컴포넌트
 * @param width 반원 또는 원의 가로 폭
 * @param variant 반원이면 half, 원이면 full
 * @param phase 지금 단계, 채우는 색을 정함
 * @param progressRatio 학습 시간 가운데 지난 비율, 종료 시각이 없으면 null
 * @param children 반원 또는 원 안에 보일 내용
 */
const SessionProgressArc = ({ width, variant, phase, progressRatio, children }: Props) => {
	const isFull = variant === 'full';
	const radius = (width - STROKE_WIDTH) / 2;
	const center = width / 2;
	const edge = STROKE_WIDTH / 2;
	const height = isFull ? width : center + edge;
	const arc = isFull
		? `M ${center} ${edge} A ${radius} ${radius} 0 0 1 ${center} ${width - edge} A ${radius} ${radius} 0 0 1 ${center} ${edge}`
		: `M ${edge} ${center} A ${radius} ${radius} 0 0 1 ${width - edge} ${center}`;
	const arcLength = (isFull ? 2 : 1) * Math.PI * radius;
	const filledLength = Math.max(0, Math.min(1, progressRatio ?? 0)) * arcLength;

	return (
		<View style={[styles.container, isFull && styles.containerFull, { width, height }]} accessible>
			{/*진행한 만큼 채워지는 반원 또는 원*/}
			<Svg width={width} height={height} style={styles.svg}>
				<Path
					d={arc}
					fill="none"
					stroke={sessionColors.track}
					strokeWidth={STROKE_WIDTH}
					strokeLinecap="round"
				/>
				{progressRatio !== null && (
					<Path
						d={arc}
						fill="none"
						stroke={sessionPhaseColors[phase]}
						strokeWidth={STROKE_WIDTH}
						strokeLinecap="round"
						strokeDasharray={`${filledLength} ${arcLength}`}
					/>
				)}
			</Svg>

			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 },
	containerFull: { justifyContent: 'center', paddingBottom: 0 },
	svg: { position: 'absolute', top: 0, left: 0 },
});

export default SessionProgressArc;
