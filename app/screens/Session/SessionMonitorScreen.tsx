import {
	type CompositeNavigationProp,
	type RouteProp,
	useNavigation,
	useRoute,
} from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { SoundRow } from "@/components/session/sound-row"
import { Button } from "@/components/ui/button"
import { ScreenHeader } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList, SwitchRow } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import type { RunningSessionDetail } from "@/hooks/use-running-session"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatMoment } from "@/i18n/format"
import {
	BatteryState,
	LiveArea,
	StatusCard,
	WarningBanner,
} from "@/screens/Session/components/monitor-parts"
import { SleepEditor } from "@/screens/Session/components/sleep-editor"
import { WordChangeModal } from "@/screens/Session/components/word-change-modal"
import { type MonitorState, useMonitor } from "@/screens/Session/hooks/use-monitor"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, "SessionMonitor">,
	NativeStackNavigationProp<RootStackParamList>
>

export function SessionMonitorScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<Navigation>()
	const { params } = useRoute<RouteProp<HomeStackParamList, "SessionMonitor">>()
	const showSummary = useCallback(
		(sessionId: string) => navigation.navigate("SessionSummary", { sessionId, role: "viewer" }),
		[navigation],
	)
	const monitor = useMonitor(showSummary)
	const detail = monitor.detail
	const stationStatus = monitor.stationStatus

	let content = <Skeleton rows={4} height={96} />

	if (monitor.isError) {
		content = <ScreenError message={t("common.loadError")} onRetry={monitor.retry} />
	} else if (!monitor.loading && !detail) {
		content = <EmptyState message={t("session.monitor.none")} />
	}

	return (
		<Screen scroll={false}>
			<View style={styles.top}>
				<ScreenHeader
					title={
						detail?.station ? (detail.station.name ?? detail.station.model) : undefined
					}
					onBack={() => navigation.goBack()}
					right={stationStatus ? <BatteryState status={stationStatus} /> : null}
				/>
				{detail && monitor.disconnected ? (
					<WarningBanner message={t("session.monitor.disconnected")} />
				) : null}
				{detail && !monitor.disconnected && stationStatus?.is_charging === false ? (
					<WarningBanner message={t("session.monitor.unplugged")} />
				) : null}
			</View>
			{detail ? (
				<MonitorBody
					detail={detail}
					monitor={monitor}
					connectLive={params?.connectLive ?? false}
					onFullscreen={() => navigation.navigate("LiveVideo")}
				/>
			) : (
				<View style={styles.top}>{content}</View>
			)}
		</Screen>
	)
}

interface Props {
	detail: RunningSessionDetail
	monitor: MonitorState
	connectLive: boolean
	onFullscreen(): void
}

function MonitorBody({ detail, monitor, connectLive, onFullscreen }: Props) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const player = useSoundPlayer()
	const [live, setLive] = useState(connectLive)
	const [picking, setPicking] = useState(false)
	const [ending, setEnding] = useState(false)
	const locked = monitor.disconnected

	const header = (
		<View style={styles.header}>
			<StatusCard
				detail={detail}
				applyingWord={monitor.applying === "word"}
				disabled={locked}
				onChangeWord={() => setPicking(true)}
			/>
			<GroupedList>
				<SwitchRow
					first
					label={t("session.start.learning")}
					value={detail.session.settings.learning_enabled}
					disabled={locked}
					busy={monitor.applying === "learning"}
					onChange={monitor.changeLearning}
				/>
				<SleepEditor disabled={locked} />
			</GroupedList>
			<InlineError
				message={monitor.changeFailed && !picking ? t("session.monitor.changeError") : null}
			/>
			{monitor.sounds.length > 0 ? (
				<Copy style={ui.label}>{t("session.monitor.sounds")}</Copy>
			) : null}
		</View>
	)

	return (
		<>
			<LiveArea
				requested={live}
				cameraAvailable={monitor.stationStatus?.camera_available ?? false}
				disabled={locked}
				onPlay={() => setLive(true)}
				onFullscreen={onFullscreen}
			/>
			<FlatList
				data={monitor.sounds}
				keyExtractor={(sound) => sound.id}
				ListHeaderComponent={header}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
				renderItem={({ item }) => (
					<SoundRow
						sound={item}
						timeLabel={formatMoment(item.captured_at, locale)}
						player={player}
					/>
				)}
				ListFooterComponent=<Button
					label={t("session.end.title")}
					variant="secondary"
					onPress={() => setEnding(true)}
					style={styles.end}
				/>
			/>
			<WordChangeModal
				visible={picking}
				currentId={detail.session.settings.word_id}
				saving={monitor.changing}
				failed={monitor.changeFailed}
				onSave={(wordId) => monitor.changeWord(wordId, () => setPicking(false))}
				onClose={() => setPicking(false)}
			/>
			<ConfirmDialog
				visible={ending}
				title={t("session.end.title")}
				message={t("session.end.viewerMessage")}
				confirmLabel={t("session.end.confirm")}
				cancelLabel={t("session.end.keep")}
				busy={monitor.finishing}
				error={monitor.finishFailed ? t("session.end.error") : null}
				onConfirm={monitor.finish}
				onClose={() => {
					monitor.resetFinish()
					setEnding(false)
				}}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	top: {
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
		gap: 10,
		paddingBottom: 10,
	},
	header: { gap: 16, paddingBottom: 8 },
	list: {
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 16,
		paddingBottom: 32,
		gap: 4,
	},
	end: { marginTop: 20 },
})
