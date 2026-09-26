import type { PropsWithChildren } from "react"
import { type StyleProp, StyleSheet, type TextStyle } from "react-native"

import { Copy } from "@/components/ui/text/copy"
import { font } from "@/theme"

interface Props {
	style?: StyleProp<TextStyle>
}

export function Title({ children, style }: PropsWithChildren<Props>) {
	return (
		<Copy accessibilityRole="header" style={[styles.title, style]}>
			{children}
		</Copy>
	)
}

const styles = StyleSheet.create({
	title: { fontFamily: font.black, fontSize: 26, lineHeight: 32 },
})
