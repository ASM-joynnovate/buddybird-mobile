import { PropsWithChildren } from "react"
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native"

import { colors, font } from "@/theme"

export function Copy({ style, ...props }: TextProps) {
	return <Text {...props} allowFontScaling={false} style={[styles.copy, style]} />
}

export function Title({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
	return (
		<Copy accessibilityRole="header" style={[styles.title, style]}>
			{children}
		</Copy>
	)
}

const styles = StyleSheet.create({
	copy: { fontFamily: font.bold, fontSize: 15, color: colors.text },
	title: { fontFamily: font.black, fontSize: 26, lineHeight: 32 },
})
