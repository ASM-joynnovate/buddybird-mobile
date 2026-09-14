import { StyleSheet } from "react-native"

import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"

export function InlineError({ message }: { message?: string | null }) {
	if (!message) {
		return null
	}

	return (
		<Copy accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
			{message}
		</Copy>
	)
}

const styles = StyleSheet.create({
	error: { color: colors.error, fontSize: 15, lineHeight: 21, marginTop: 10 },
})
