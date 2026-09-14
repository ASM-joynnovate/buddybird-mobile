import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { Copy, Title } from "@/components/ui/text"
import { useAppData } from "@/hooks/use-app-data"
import { CaptureItem } from "@/screens/SessionCaptures/components/capture-item"
import { useCapturePlayback } from "@/screens/SessionCaptures/hooks/use-capture-playback"
import { sessionCaptures } from "@/services/session/captures"
import { colors } from "@/theme"
import { CAPTURE_STORAGE_LIMIT_BYTES } from "@/types/capture"
import type { RootStackParamList } from "@/types/navigation"

export function SessionCapturesScreen({
	route,
	navigation,
}: NativeStackScreenProps<RootStackParamList, "SessionCaptures">) {
	const { t } = useTranslation()
	const data = useAppData()
	const insets = useSafeAreaInsets()
	const { sessionId, word } = route.params
	const summary = useMemo(() => sessionCaptures(data, sessionId), [data, sessionId])
	const playback = useCapturePlayback()

	return (
		<Screen scroll={false}>
			<View style={styles.header}>
				<IconButton
					testID="captures-close"
					icon="back"
					label={t("common.back")}
					onPress={() => navigation.goBack()}
				/>
				<View style={styles.heading}>
					<Title style={styles.title}>{t("captures.title")}</Title>
					<Copy>{word}</Copy>
				</View>
			</View>
			<View style={styles.status}>
				<Copy testID="captures-summary" style={styles.meta}>
					{t("captures.storage", {
						count: summary.captures.length,
						session: (summary.sessionBytes / 1048576).toFixed(1),
						total: (summary.totalBytes / 1048576).toFixed(1),
						limit: CAPTURE_STORAGE_LIMIT_BYTES / 1048576,
					})}
				</Copy>
				<InlineError message={playback.failed ? t("captures.playbackError") : null} />
			</View>
			<FlatList
				testID="session-captures"
				data={summary.captures}
				keyExtractor={(capture) => capture.id}
				contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 22 }]}
				ListEmptyComponent={<Copy style={styles.empty}>{t("captures.empty")}</Copy>}
				renderItem={({ item }) => (
					<CaptureItem
						capture={item}
						activeKey={playback.activeKey}
						play={playback.play}
						stop={playback.stop}
					/>
				)}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 22,
		paddingBottom: 16,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	heading: { flex: 1, gap: 4 },
	title: { fontSize: 26, lineHeight: 34 },
	status: {
		paddingHorizontal: 22,
		paddingBottom: 16,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	meta: { fontSize: 14, color: colors.muted, lineHeight: 22 },
	list: { flexGrow: 1, paddingHorizontal: 22, width: "100%", maxWidth: 480, alignSelf: "center" },
	empty: { textAlign: "center", color: colors.muted, lineHeight: 26, marginTop: 44 },
})
