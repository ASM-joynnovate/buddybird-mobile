import { StyleSheet, View } from "react-native"
import Svg, { Path } from "react-native-svg"

import { Copy } from "@/components/ui/text"
import { font } from "@/theme"
import { night, nightPhaseColor } from "@/theme/night"
import type { Phase } from "@/types/apis/sessions"
import { joinLabel } from "@/utils/a11y"

const STROKE = 16

interface Props {
	width: number
	phase: Phase
	fraction: number | null
	title: string
	detail: string | null
}

export function HorizonRing({ width, phase, fraction, title, detail }: Props) {
	const radius = (width - STROKE) / 2
	const baseline = radius + STROKE / 2
	const arc = `M ${STROKE / 2} ${baseline} A ${radius} ${radius} 0 0 1 ${width - STROKE / 2} ${baseline}`
	const length = Math.PI * radius
	const shown = Math.max(0, Math.min(1, fraction ?? 0)) * length

	return (
		<View
			style={[styles.ring, { width, height: baseline + STROKE / 2 }]}
			accessible
			accessibilityLabel={joinLabel(title, detail)}
		>
			<Svg width={width} height={baseline + STROKE / 2} style={styles.svg}>
				<Path
					d={arc}
					fill="none"
					stroke={night.track}
					strokeWidth={STROKE}
					strokeLinecap="round"
				/>
				{fraction === null ? null : (
					<Path
						d={arc}
						fill="none"
						stroke={nightPhaseColor(phase)}
						strokeWidth={STROKE}
						strokeLinecap="round"
						strokeDasharray={`${shown} ${length}`}
					/>
				)}
			</Svg>
			<View style={styles.center}>
				<Copy style={styles.title}>{title}</Copy>
				{detail === null ? null : <Copy style={styles.detail}>{detail}</Copy>}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	ring: { alignItems: "center", justifyContent: "flex-end" },
	svg: { position: "absolute", top: 0, left: 0 },
	center: { alignItems: "center", gap: 4, paddingBottom: 12 },
	title: { fontFamily: font.black, fontSize: 20, color: night.text },
	detail: {
		fontFamily: font.black,
		fontSize: 26,
		color: night.text,
		fontVariant: ["tabular-nums"],
	},
})
