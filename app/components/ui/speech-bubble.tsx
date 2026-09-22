import { type PropsWithChildren, useEffect, useState } from "react"
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native"
import { useReducedMotion } from "react-native-reanimated"

import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

const TYPING_INTERVAL_MS = 20
const NUMBER_BEFORE_HANGUL = /(\d)(?=[가-힣])/g
const WORD_JOINER = "\u2060"

function keepNumbersWithUnits(text: string) {
	return text.replace(NUMBER_BEFORE_HANGUL, `$1${WORD_JOINER}`)
}

export function SpeechBubble({
	children,
	side = "bottom",
	typing = false,
	style,
}: PropsWithChildren<{
	side?: "bottom" | "left"
	typing?: boolean
	style?: StyleProp<ViewStyle>
}>) {
	return (
		<Card cornerRadius={16} style={style} contentStyle={styles.bubble}>
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

function TypedText({ text }: { text: string }) {
	const reduced = useReducedMotion()
	const characters = Array.from(text)
	const [count, setCount] = useState(0)
	const shown = reduced ? characters.length : count
	const done = shown >= characters.length

	useEffect(() => {
		if (done) {
			return
		}

		const timer = setTimeout(() => setCount((current) => current + 1), TYPING_INTERVAL_MS)

		return () => clearTimeout(timer)
	}, [count, done])

	return (
		<View>
			<Copy
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				lineBreakStrategyIOS="hangul-word"
				style={[styles.text, styles.hidden]}
			>
				{text}
			</Copy>
			<Copy
				accessibilityLabel={text}
				lineBreakStrategyIOS="hangul-word"
				onPress={done ? undefined : () => setCount(characters.length)}
				style={[styles.text, styles.typed]}
			>
				{characters.slice(0, shown).join("")}
				{done ? null : <Text style={styles.caret}>▍</Text>}
			</Copy>
		</View>
	)
}

const styles = StyleSheet.create({
	bubble: {
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	text: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, textAlign: "left" },
	hidden: { opacity: 0 },
	typed: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
	caret: { color: colors.orange },
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
