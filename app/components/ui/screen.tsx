import type { PropsWithChildren, ReactNode } from "react"
import { ScrollView, type ScrollViewProps, StyleSheet, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { colors } from "@/theme"

interface Props extends ScrollViewProps {
	scroll?: boolean
	footer?: ReactNode
}

export function Screen({
	children,
	scroll = true,
	automaticallyAdjustKeyboardInsets = true,
	style,
	contentContainerStyle,
	footer,
	...props
}: PropsWithChildren<Props>) {
	const insets = useSafeAreaInsets()

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={[styles.screen, style]}>
			{scroll ? (
				<ScrollView
					alwaysBounceVertical={false}
					{...props}
					automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					keyboardDismissMode="on-drag"
					contentContainerStyle={[
						styles.content,
						{ paddingBottom: footer ? 20 : insets.bottom + 20 },
						contentContainerStyle,
					]}
				>
					{children}
				</ScrollView>
			) : (
				children
			)}
			{footer ? (
				<View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>
			) : null}
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
	footer: {
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
		gap: 8,
	},
})
