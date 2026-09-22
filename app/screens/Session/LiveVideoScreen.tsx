import { useNavigation } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { IconButton } from "@/components/ui/icon-button"
import { Copy } from "@/components/ui/text"
import { runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { night } from "@/screens/Session/components/night"
import { isDisconnected, useNow } from "@/screens/Session/hooks/use-clock"
import { colors, font } from "@/theme"

const CONNECT_MS = 1500

export function LiveVideoScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation()
	const running = useQuery(runningSessionQueryOptions())
	const now = useNow(true, 5000)
	const [attempt, setAttempt] = useState(0)
	const [connecting, setConnecting] = useState(true)
	const session = running.data
	const disconnected =
		session !== undefined &&
		(session === null || isDisconnected(session.progress.last_heartbeat_at, now))

	useEffect(() => {
		const timer = setTimeout(() => setConnecting(false), CONNECT_MS)

		return () => clearTimeout(timer)
	}, [attempt])

	let center = <ActivityIndicator color={colors.onAccent} size="large" />

	if (disconnected) {
		center = (
			<View style={styles.message}>
				<Icon name="wifiOff" size={32} color={night.text} />
				<Copy style={styles.text}>{t("session.live.disconnected")}</Copy>
			</View>
		)
	} else if (!connecting) {
		center = (
			<View style={styles.message}>
				<Copy style={styles.text}>{t("session.live.notReady")}</Copy>
				<Button
					label={t("common.retry")}
					variant="secondary"
					icon="refresh"
					compact
					onPress={() => {
						setConnecting(true)
						setAttempt((count) => count + 1)
					}}
				/>
			</View>
		)
	}

	return (
		<View style={styles.screen}>
			<View style={[StyleSheet.absoluteFill, styles.center]} accessibilityLiveRegion="polite">
				{center}
			</View>
			<SafeAreaView style={styles.overlay} edges={["top", "left", "right"]}>
				<IconButton
					icon="close"
					label={t("common.close")}
					color={colors.onAccent}
					onPress={() => navigation.goBack()}
				/>
			</SafeAreaView>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: night.background },
	center: { alignItems: "center", justifyContent: "center" },
	overlay: { padding: 16, alignItems: "flex-start" },
	message: { alignItems: "center", gap: 14, paddingHorizontal: 24 },
	text: { fontFamily: font.extraBold, fontSize: 16, color: colors.onAccent, textAlign: "center" },
})
