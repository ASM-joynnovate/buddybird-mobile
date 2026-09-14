import { PropsWithChildren } from "react"
import { ScrollView, ScrollViewProps, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { colors } from "@/theme"

export function Screen({
	children,
	scroll = true,
	style,
	contentContainerStyle,
	...props
}: PropsWithChildren<ScrollViewProps & { scroll?: boolean }>) {
	return (
		<SafeAreaView edges={["top"]} style={[styles.screen, style]}>
			{scroll ? (
				<ScrollView
					{...props}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					contentContainerStyle={[styles.content, contentContainerStyle]}
				>
					{children}
				</ScrollView>
			) : (
				children
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	content: {
		flexGrow: 1,
		padding: 22,
		paddingBottom: 30,
		width: "100%",
		maxWidth: 680,
		alignSelf: "center",
	},
})
