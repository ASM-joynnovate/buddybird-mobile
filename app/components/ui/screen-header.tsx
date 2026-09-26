import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { SpeechBubble } from "@/components/ui/speech-bubble"
import { Title } from "@/components/ui/text"

interface Props {
	title?: string
	onBack?(): void
	backIcon?: "back" | "close"
	right?: ReactNode
	help?: string
	large?: boolean
}

export function ScreenHeader({
	title,
	onBack,
	backIcon = "back",
	right,
	help,
	large = false,
}: Props) {
	const { t } = useTranslation()

	const [helpOpen, setHelpOpen] = useState(false)

	return (
		<View style={styles.wrap}>
			<View style={styles.header}>
				{onBack ? (
					<IconButton
						icon={backIcon}
						label={t(backIcon === "close" ? "common.close" : "common.back")}
						onPress={onBack}
					/>
				) : null}
				{title ? (
					<Title style={[styles.title, !large && styles.compact]}>{title}</Title>
				) : (
					<View style={styles.spacer} />
				)}
				<View style={styles.right}>
					{right}
					{help ? (
						<IconButton
							icon="help"
							label={t(helpOpen ? "common.helpClose" : "common.help")}
							variant={helpOpen ? "accent" : "muted"}
							onPress={() => setHelpOpen((open) => !open)}
						/>
					) : null}
				</View>
			</View>
			{help && helpOpen ? (
				<SpeechBubble side="bottom" style={styles.bubble}>
					{help}
				</SpeechBubble>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	wrap: { gap: 12, marginBottom: 8 },
	header: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 4 },
	title: { flex: 1, minWidth: 0 },
	compact: { fontSize: 20, lineHeight: 26 },
	spacer: { flex: 1 },
	right: { flexDirection: "row", alignItems: "center", gap: 2 },
	bubble: { alignSelf: "flex-end", maxWidth: "90%" },
})
