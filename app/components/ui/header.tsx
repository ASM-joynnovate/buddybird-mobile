import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { SpeechBubble } from "@/components/ui/speech-bubble"
import { PressableSurface } from "@/components/ui/surface"
import { Copy, Title } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

export function ScreenHeader({
	title,
	onBack,
	backIcon = "back",
	right,
	help,
	large = false,
}: {
	title?: string
	onBack?(): void
	backIcon?: "back" | "close"
	right?: ReactNode
	help?: string
	large?: boolean
}) {
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
							color={helpOpen ? colors.orange : colors.muted}
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

export function TextButton({
	label,
	onPress,
	disabled,
	tone = "primary",
}: {
	label: string
	onPress(): void
	disabled?: boolean
	tone?: "primary" | "muted"
}) {
	return (
		<PressableSurface
			accessibilityLabel={label}
			disabled={disabled}
			onPress={onPress}
			tone="plain"
			depth={0}
			cornerRadius={radius.control}
			contentStyle={styles.textButton}
		>
			<Copy
				style={[
					styles.textButtonLabel,
					tone === "muted" && styles.muted,
					disabled && styles.disabled,
				]}
			>
				{label}
			</Copy>
		</PressableSurface>
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
	textButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8, borderWidth: 0 },
	textButtonLabel: { fontFamily: font.extraBold, fontSize: 15, color: colors.orangeDark },
	muted: { color: colors.muted },
	disabled: { color: colors.disabled },
})
