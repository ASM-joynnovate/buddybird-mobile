import type { PropsWithChildren } from "react"
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native"

import { TypedText } from "@/components/ui/speech-bubble/typed-text"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

const NUMBER_BEFORE_HANGUL = /(\d)(?=[가-힣])/g
const WORD_JOINER = "⁠"

function keepNumbersWithUnits(text: string) {
	return text.replace(NUMBER_BEFORE_HANGUL, `$1${WORD_JOINER}`)
}

interface Props {
	side?: "bottom" | "left"
	typing?: boolean
	style?: StyleProp<ViewStyle>
}

export function SpeechBubble({
	children,
	side = "bottom",
	typing = false,
	style,
}: PropsWithChildren<Props>) {
	return (
		<Card cornerRadius="control" style={style} contentStyle={styles.bubble}>
			<View
				pointerEvents="none"
				style={[styles.pointer, side === "left" ? styles.left : styles.bottom]}
			/>
			{typing && typeof children === "string" ? (
				<TypedText key={children} text={keepNumbersWithUnits(children)} />
			) : (
				<Copy lineBreakStrategyIOS="hangul-word" style={styles.text}>
					{typeof children === "string" ? keepNumbersWithUnits(children) : children}
				</Copy>
			)}
		</Card>
	)
}

const styles = StyleSheet.create({
	bubble: {
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	text: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, textAlign: "left" },
	pointer: {
		position: "absolute",
		width: 16,
		height: 16,
		backgroundColor: colors.background,
		borderRightWidth: 2,
		borderBottomWidth: 2,
		borderColor: colors.border,
	},
	bottom: { bottom: -10, left: "50%", transform: [{ translateX: -8 }, { rotate: "45deg" }] },
	left: { left: -10, top: 22, transform: [{ rotate: "135deg" }] },
})
