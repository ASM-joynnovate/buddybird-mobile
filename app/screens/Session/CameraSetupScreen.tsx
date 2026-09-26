import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { IconButton } from "@/components/ui/icon-button"
import { Copy } from "@/components/ui/text"
import { StartDialogs } from "@/screens/Session/components/start-dialogs"
import { useStartSession } from "@/screens/Session/hooks/use-start-session"
import { colors, font } from "@/theme"
import { night } from "@/theme/night"
import type { RootStackParamList } from "@/types/navigation"

export function CameraSetupScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "CameraSetup">>()

	const starter = useStartSession((sessionId) => navigation.replace("SessionRun", { sessionId }))

	return (
		<View style={styles.screen}>
			<View
				style={[StyleSheet.absoluteFill, styles.preview]}
				accessible
				accessibilityLabel={t("session.camera.preview")}
			>
				<Icon name="camera" size={40} color={night.text} />
			</View>
			<SafeAreaView style={styles.overlay} edges={["top", "bottom", "left", "right"]}>
				<View style={styles.top}>
					<IconButton
						icon="back"
						label={t("common.back")}
						color={colors.onAccent}
						onPress={() => navigation.goBack()}
					/>
					<Copy style={styles.hint}>{t("session.camera.hint")}</Copy>
				</View>
				<View style={styles.bottom}>
					<Button
						label={t("session.camera.start")}
						icon="play"
						compact
						loading={starter.busy}
						onPress={() => starter.start(params.draft)}
					/>
				</View>
			</SafeAreaView>
			<StartDialogs state={starter} />
		</View>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: night.background },
	preview: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: night.surface,
	},
	overlay: { flex: 1, justifyContent: "space-between", padding: 16 },
	top: { flexDirection: "row", alignItems: "center", gap: 8 },
	hint: { flex: 1, fontFamily: font.extraBold, fontSize: 16, color: colors.onAccent },
	bottom: { flexDirection: "row", justifyContent: "flex-end" },
})
