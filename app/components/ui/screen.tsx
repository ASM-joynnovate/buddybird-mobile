import { PropsWithChildren } from "react"
import { ScrollView, ScrollViewProps, StyleSheet } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { colors } from "@/theme"

export function Screen({
	children,
	scroll = true,
	automaticallyAdjustKeyboardInsets = true,
	style,
	contentContainerStyle,
	...props
}: PropsWithChildren<ScrollViewProps & { scroll?: boolean }>) {
	const insets = useSafeAreaInsets()

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={[styles.screen, style]}>
			{scroll ? (
				<ScrollView
					{...props}
					automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					contentContainerStyle={[
						styles.content,
						{ paddingBottom: insets.bottom + 20 },
						contentContainerStyle,
					]}
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
		minWidth: 0,
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 30,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
})
