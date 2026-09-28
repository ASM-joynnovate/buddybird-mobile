import { StyleSheet, View } from 'react-native';

import type { Phase } from '@/types/apis/sessions';

import Svg, { Path } from 'react-native-svg';

import { font } from '@/theme';
import { sessionColors, sessionPhaseColors } from '@/theme/session-colors';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

const STROKE_WIDTH = 16;

interface Props {
	width: number;
	phase: Phase;
	progressRatio: number | null;
	title: string;
	detail: string | null;
}

export function SessionProgressArc({ width, phase, progressRatio, title, detail }: Props) {
	const radius = (width - STROKE_WIDTH) / 2;
	const baseline = radius + STROKE_WIDTH / 2;
	const arc = `M ${STROKE_WIDTH / 2} ${baseline} A ${radius} ${radius} 0 0 1 ${width - STROKE_WIDTH / 2} ${baseline}`;
	const arcLength = Math.PI * radius;
	const filledLength = Math.max(0, Math.min(1, progressRatio ?? 0)) * arcLength;

	return (
		<View
			style={[styles.ring, { width, height: baseline + STROKE_WIDTH / 2 }]}
			accessible
			accessibilityLabel={joinLabel(title, detail)}
		>
			{/*진행 고리*/}
			<Svg width={width} height={baseline + STROKE_WIDTH / 2} style={styles.svg}>
				<Path
					d={arc}
					fill="none"
					stroke={sessionColors.track}
					strokeWidth={STROKE_WIDTH}
					strokeLinecap="round"
				/>
				{progressRatio === null ? null : (
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

			{/*단계 이름과 남은 시간*/}
			<View style={styles.center}>
				<Copy style={styles.title}>{title}</Copy>
				{detail === null ? null : <Copy style={styles.detail}>{detail}</Copy>}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	ring: { alignItems: 'center', justifyContent: 'flex-end' },
	svg: { position: 'absolute', top: 0, left: 0 },
	center: { alignItems: 'center', gap: 4, paddingBottom: 12 },
	title: { fontFamily: font.black, fontSize: 20, color: sessionColors.text },
	detail: {
		fontFamily: font.black,
		fontSize: 26,
		color: sessionColors.text,
		fontVariant: ['tabular-nums'],
	},
});
