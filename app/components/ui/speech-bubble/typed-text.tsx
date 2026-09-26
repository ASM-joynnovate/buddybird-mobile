import { useEffect, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useReducedMotion } from "react-native-reanimated"

import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

const TYPING_INTERVAL_MS = 20

interface Props {
	text: string
}

export function TypedText({ text }: Props) {
	const reduced = useReducedMotion()

	const [count, setCount] = useState(0)

	const characters = Array.from(text)
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
	text: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, textAlign: "left" },
	hidden: { opacity: 0 },
	typed: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
	caret: { color: colors.orange },
})
