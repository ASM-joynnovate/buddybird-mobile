import { StyleSheet, View } from "react-native"

import { Mascot } from "@/components/mascot"
import { SpeechBubble } from "@/components/ui/speech-bubble"

interface Props {
	message: string
}

export function BuddySays({ message }: Props) {
	return (
		<View style={styles.row}>
			<Mascot size={72} />
			<SpeechBubble side="left" typing style={styles.bubble}>
				{message}
			</SpeechBubble>
		</View>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
	bubble: { flex: 1, minWidth: 0, marginTop: 4 },
})
