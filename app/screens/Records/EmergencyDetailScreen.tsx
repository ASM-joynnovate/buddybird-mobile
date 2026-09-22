import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { AudioWaveform } from "@/components/ui/audio-waveform"
import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/ui/header"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { Copy } from "@/components/ui/text"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatDateTime } from "@/i18n/format"
import type { Emergency } from "@/mocks/types"
import { useEmergencyRecord } from "@/screens/Records/hooks/use-emergency-record"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font, radius } from "@/theme"
import type { RecordsStackParamList, RootStackParamList } from "@/types/navigation"

export function EmergencyDetailScreen() {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const insets = useSafeAreaInsets()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RecordsStackParamList, "EmergencyDetail">>()

	const record = useEmergencyRecord(params.emergencyId)
	const emergency = record.query.data

	function renderBody() {
		if (record.deleted) {
			return <EmptyState message={t("records.emergency.deleted")} />
		}

		if (record.query.isError) {
			return (
				<ScreenError
					message={t("common.loadError")}
					onRetry={() => void record.query.refetch()}
				/>
			)
		}

		if (!emergency) {
			return <Skeleton rows={2} height={180} />
		}

		return (
			<View style={styles.body}>
				<Media emergency={emergency} />
				<View style={styles.info}>
					<View style={styles.kind}>
						<Copy style={styles.kindText}>
							{t(`common.emergencyKinds.${emergency.kind}`)}
						</Copy>
					</View>
					<Copy style={styles.time}>
						{t("records.emergency.detectedAt", {
							time: formatDateTime(emergency.detected_at, locale),
						})}
					</Copy>
				</View>
				<InlineError
					message={record.downloadFailed ? t("records.emergency.downloadError") : null}
				/>
			</View>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
				<ScreenHeader
					title={t("records.emergency.title")}
					onBack={() => navigation.goBack()}
					right={
						emergency && !record.deleted ? (
							<>
								{emergency.media ? (
									<IconButton
										icon="download"
										label={t("records.emergency.download")}
										onPress={() => void record.download()}
									/>
								) : null}
								<IconButton
									icon="trash"
									label={t("records.emergency.delete")}
									onPress={record.openDelete}
								/>
							</>
						) : null
					}
				/>
				{renderBody()}
				{emergency?.session_running && !record.deleted ? (
					<Button
						label={t("records.emergency.watchNow")}
						icon="camera"
						onPress={() =>
							navigation.navigate("Main", {
								screen: "HomeTab",
								params: { screen: "SessionMonitor", params: { connectLive: true } },
							})
						}
					/>
				) : null}
			</View>
			<ConfirmDialog
				visible={record.deleteOpen}
				title={t("common.confirmDelete.title", { name: t("records.emergency.deleteName") })}
				message={t("common.confirmDelete.message")}
				confirmLabel={t("common.confirmDelete.confirm")}
				cancelLabel={t("common.cancel")}
				busy={record.deleting}
				error={record.deleteFailed ? t("records.emergency.deleteError") : null}
				onConfirm={() => record.confirmDelete(() => navigation.goBack())}
				onClose={record.closeDelete}
			/>
		</Screen>
	)
}

function Media({ emergency }: { emergency: Emergency }) {
	const { t } = useTranslation()
	const player = useSoundPlayer()
	const media = emergency.media

	if (media?.type !== "audio") {
		return (
			<View style={styles.media}>
				<Copy style={styles.pending}>
					{t(media ? "records.emergency.videoPending" : "records.emergency.noMedia")}
				</Copy>
			</View>
		)
	}

	const playing = player.playingId === emergency.id

	return (
		<View>
			<View style={[styles.media, styles.audio]}>
				<View style={styles.wave}>
					<AudioWaveform
						color={colors.error}
						height={72}
						barCount={28}
						animated={playing}
						testID="emergency-waveform"
					/>
				</View>
				<IconButton
					icon={playing ? "pause" : "play"}
					label={t(playing ? "records.emergency.stop" : "records.emergency.play")}
					tone="primary"
					round
					size={56}
					color={colors.onAccent}
					onPress={() => player.toggle(emergency.id, media.url)}
				/>
			</View>
			<InlineError
				message={player.failedId === emergency.id ? t("records.emergency.playError") : null}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		gap: 12,
		paddingHorizontal: 24,
		paddingTop: 20,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	body: { flex: 1, gap: 20 },
	media: {
		minHeight: 180,
		borderRadius: radius.hero,
		borderCurve: "continuous",
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	audio: { flexDirection: "row", gap: 16 },
	wave: { flex: 1, minWidth: 0 },
	pending: {
		fontFamily: font.extraBold,
		fontSize: 14,
		color: colors.muted,
		textAlign: "center",
	},
	info: { gap: 8, alignItems: "flex-start" },
	kind: {
		borderRadius: radius.pill,
		borderWidth: 2,
		borderColor: colors.error,
		paddingHorizontal: 14,
		paddingVertical: 4,
	},
	kindText: { fontFamily: font.extraBold, fontSize: 13.5, color: colors.error },
	time: { fontFamily: font.extraBold, fontSize: 15, color: colors.text },
})
