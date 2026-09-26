import { StyleSheet, View } from "react-native"

import { DOT, DOT_TOP, MARKER } from "@/components/session/absence-strip/layout"
import { PressableSurface } from "@/components/ui/surface"

interface Props {
	left: number
	color: string
	label: string
	onPress?(): void
}

export function Marker({ left, color, label, onPress }: Props) {
	const dot = <View style={[styles.dot, { backgroundColor: color }]} />
	const position = [styles.marker, { left: left - MARKER / 2 }]

	if (!onPress) {
		return (
			<View style={position} accessible accessibilityLabel={label}>
				{dot}
			</View>
		)
	}

	return (
		<PressableSurface
			accessibilityLabel={label}
			onPress={onPress}
			tone="plain"
			depth={0}
			cornerRadius={MARKER / 2}
			style={position}
			contentStyle={styles.markerFace}
		>
			{dot}
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	marker: {
		position: "absolute",
		top: DOT_TOP + DOT / 2 - MARKER / 2,
		width: MARKER,
		height: MARKER,
		alignItems: "center",
		justifyContent: "center",
	},
	markerFace: { alignItems: "center", justifyContent: "center", borderWidth: 0 },
	dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
})
