import { StyleSheet, View } from "react-native"

import { colors } from "@/theme"

interface Props {
	label?: string
}

export function DotBadge({ label }: Props) {
	return <View accessible={Boolean(label)} accessibilityLabel={label} style={styles.dot} />
}

const styles = StyleSheet.create({
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
})
