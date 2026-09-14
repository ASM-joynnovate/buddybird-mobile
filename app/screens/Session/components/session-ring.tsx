import { useTranslation } from "react-i18next"

import { Image, StyleSheet, useWindowDimensions, View } from "react-native"

import Svg, { Circle } from "react-native-svg"

import { Copy } from "@/components/ui/text"
import { colors, font, mascot } from "@/theme"
import type { SessionSnapshot } from "@modules/session-audio-engine"

export function SessionRing({
	phase,
	wordLabel,
	timer,
	progress,
}: {
	phase: SessionSnapshot["phase"]
	wordLabel?: string
	timer: string
	progress: number
}) {
	const { t } = useTranslation()
	const { width, height } = useWindowDimensions()
	const learning = phase === "learning"
	const accent = learning ? colors.orange : colors.blue
	let phaseTitle = wordLabel

	if (phase === "rest") {
		phaseTitle = t("session.rest")
	} else if (phase === "stress-care") {
		phaseTitle = t("session.care")
	}

	const size = Math.min(width - 90, height * 0.4, 310)
	const radius = (size - 18) / 2
	const circumference = Math.PI * 2 * radius
	const sessionLabel = (
		<View style={{ width: size - 48 }}>
			<Copy
				numberOfLines={learning ? 1 : undefined}
				ellipsizeMode="tail"
				style={[styles.phaseTitle, !learning && styles.restTitle]}
			>
				{phaseTitle}
			</Copy>
			<Copy
				testID="session-countdown"
				style={styles.timer}
			>
				{timer}
			</Copy>
		</View>
	)

	return (
		<View style={styles.middle}>
			<View style={{ width: size, height: size }}>
				<Svg
					width={size}
					height={size}
					accessibilityElementsHidden
					importantForAccessibility="no"
				>
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={colors.border}
						strokeWidth={17}
					/>
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={accent}
						strokeWidth={17}
						strokeLinecap="round"
						strokeDasharray={`${circumference} ${circumference}`}
						strokeDashoffset={circumference * (1 - progress)}
						rotation={-90}
						origin={`${size / 2}, ${size / 2}`}
					/>
				</Svg>
				<View style={styles.ringContent}>
					<Image
						source={mascot}
						style={[styles.sessionMascot, { height: size * 0.36, width: size * 0.36 }]}
					/>
					{sessionLabel}
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	middle: {
		flexGrow: 1,
		minHeight: 230,
		justifyContent: "center",
		alignItems: "center",
		marginVertical: 12,
	},
	ringContent: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	sessionMascot: { resizeMode: "contain", marginBottom: 10 },
	phaseTitle: { fontSize: 30, fontFamily: font.black, textAlign: "center" },
	restTitle: { fontSize: 24 },
	timer: {
		fontSize: 28,
		fontFamily: font.black,
		marginTop: 9,
		fontVariant: ["tabular-nums"],
		alignSelf: "center",
		textAlign: "center",
	},
})
