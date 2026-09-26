import { StyleSheet, View } from "react-native"

import { colors, radius } from "@/theme"

interface Props {
	rows?: number
	height?: number
}

export function Skeleton({ rows = 3, height = 72 }: Props) {
	return (
		<View style={styles.skeleton} accessibilityElementsHidden>
			{Array.from({ length: rows }, (_, index) => (
				<View key={index} style={[styles.block, { height }]} />
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	skeleton: { gap: 10 },
	block: { borderRadius: radius.card, backgroundColor: colors.surface },
})
