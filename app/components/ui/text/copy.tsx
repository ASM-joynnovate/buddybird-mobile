import { StyleSheet, Text, type TextProps } from "react-native"

import { colors, font } from "@/theme"

interface Props extends TextProps {}

export function Copy({ style, ...props }: Props) {
	return <Text {...props} allowFontScaling={false} style={[styles.copy, style]} />
}

const styles = StyleSheet.create({
	copy: { fontFamily: font.bold, fontSize: 15, color: colors.text },
})
