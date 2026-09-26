import { type CompositeNavigationProp, useIsFocused, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { DurationPicker } from "@/components/session/duration-picker"
import { SleepEditor } from "@/components/session/sleep-editor"
import { StartDialogs } from "@/components/session/start-dialogs"
import { WordPicker } from "@/components/session/word-picker"
import { Button } from "@/components/ui/button"
import { TextButton } from "@/components/ui/header"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList, NavRow } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { Sheet } from "@/components/ui/sheet"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { SCREEN_REFRESH_MS } from "@/config"
import { homeSummaryQueryOptions } from "@/hooks/apis/home"
import { finishSessionMutationOptions } from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { useDevices } from "@/hooks/use-devices"
import { usePermission } from "@/hooks/use-permission"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatClock, formatDuration } from "@/i18n/format"
import { NoticePopup } from "@/screens/Home/components/notice-popup"
import { useNoticePopup } from "@/screens/Home/hooks/use-notice-popup"
import { useSessionDraft } from "@/screens/Home/hooks/use-session-draft"
import { useStaleStationCleanup } from "@/screens/Home/hooks/use-stale-station-cleanup"
import { useStartSession } from "@/screens/Home/hooks/use-start-session"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { font } from "@/theme"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, "Home">,
	NativeStackNavigationProp<RootStackParamList>
>

type OpenSheet = "word" | "duration" | "sleep" | null

export function HomeScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<Navigation>()
	const focused = useIsFocused()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const summary = useQuery({
		...homeSummaryQueryOptions(),
		refetchInterval: focused ? SCREEN_REFRESH_MS : false,
	})
	const { devices } = useDevices()

	const finishing = useIdempotentMutation(finishSessionMutationOptions())

	const session = useSessionDraft()

	const popup = useNoticePopup(summary.data?.unread_notices)

	const microphone = usePermission("microphone")

	const player = useSoundPlayer()

	const starter = useStartSession((sessionId, draft, endsAt) =>
		navigation.navigate("SessionRun", {
			sessionId,
			wordId: draft.wordId,
			endsAt,
			sleep: draft.sleep,
		}),
	)

	const [sheet, setSheet] = useState<OpenSheet>(null)

	useStaleStationCleanup()

	const running = summary.data?.running_session ?? null
	const runningElsewhere =
		running !== null &&
		devices?.some((device) => device.isRunningSession && !device.isThisDevice)
	const unread = summary.data?.unread_notification_count ?? 0

	function start() {
		const draft = session.draft

		if (!draft) {
			return
		}

		player.stop()

		void microphone.run(() => starter.start(draft))
	}

	return (
		<Screen scroll={false}>
			<View style={styles.screen}>
				<View style={styles.top}>
					<IconButton
						icon="gear"
						label={t("home.settings")}
						onPress={() => navigation.navigate("Settings")}
					/>
					<IconButton
						icon="bell"
						label={
							unread > 0
								? t("home.notificationsUnread", { count: unread })
								: t("home.notifications")
						}
						onPress={() => navigation.navigate("Notifications")}
					/>
				</View>
				<View style={styles.body}>
					{summary.isError || session.isError ? (
						<ScreenError
							message={t("common.loadError")}
							onRetry={() => {
								void summary.refetch()
								session.retry()
							}}
						/>
					) : null}
					{running && runningElsewhere ? (
						<Card contentStyle={styles.elsewhere}>
							<Copy style={styles.elsewhereText}>{t("session.start.elsewhere")}</Copy>
							<TextButton
								label={t("session.start.endElsewhere")}
								disabled={finishing.isPending}
								onPress={() => finishing.mutate({ id: running.id })}
							/>
							<InlineError
								message={finishing.isError ? t("session.end.error") : null}
							/>
						</Card>
					) : null}
					<GroupedList>
						<NavRow
							first
							icon="words"
							label={t("session.start.word")}
							value={session.word?.name ?? t("session.start.choose")}
							onPress={() => setSheet("word")}
						/>
						<NavRow
							icon="clock"
							label={t("session.start.duration")}
							value={
								session.durationMs === null
									? t("session.start.untilEnd")
									: formatDuration(session.durationMs, locale)
							}
							onPress={() => setSheet("duration")}
						/>
						<NavRow
							icon="moon"
							label={t("session.sleep.label")}
							value={
								session.sleep
									? t("session.sleep.range", {
											sleep: formatClock(session.sleep.sleep_at, locale),
											wake: formatClock(session.sleep.wake_at, locale),
										})
									: undefined
							}
							disabled={!session.sleep}
							onPress={() => setSheet("sleep")}
						/>
					</GroupedList>
				</View>
				<Button
					label={t("common.start")}
					icon="play"
					loading={starter.busy}
					disabled={!session.draft}
					onPress={start}
				/>
			</View>
			<Sheet
				list
				visible={sheet === "word"}
				title={t("session.start.word")}
				onClose={() => setSheet(null)}
			>
				{session.loading ? <Skeleton rows={3} /> : null}
				{!session.loading && session.words.length === 0 ? (
					<EmptyState
						message={t("session.start.empty")}
						action={{
							label: t("session.start.addWord"),
							onPress: () => {
								setSheet(null)

								navigation.navigate("Main", {
									screen: "WordsTab",
									params: { screen: "WordEditor" },
								})
							},
						}}
					/>
				) : null}
				{session.words.length > 0 ? (
					<WordPicker
						words={session.words}
						selectedId={session.word?.id ?? null}
						player={player}
						onSelect={(id) => {
							session.selectWord(id)

							setSheet(null)
						}}
					/>
				) : null}
			</Sheet>
			<Sheet
				visible={sheet === "duration"}
				title={t("session.start.duration")}
				onClose={() => setSheet(null)}
			>
				<DurationPicker value={session.durationMs} onChange={session.setDurationMs} />
			</Sheet>
			<Sheet
				visible={sheet === "sleep"}
				title={t("session.sleep.label")}
				onClose={() => setSheet(null)}
			>
				{session.sleep ? (
					<SleepEditor value={session.sleep} onChange={session.setSleep} />
				) : null}
			</Sheet>
			<StartDialogs state={starter} />
			<PermissionDialog {...microphone.dialog} />
			<NoticePopup
				notice={focused ? popup.current : null}
				onClose={popup.close}
				onDetail={(noticeId) => {
					popup.close()

					navigation.navigate("NoticeDetail", { noticeId })
				}}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 8,
		paddingBottom: 16,
		gap: 16,
	},
	top: { flexDirection: "row", justifyContent: "flex-end", gap: 4 },
	body: { flex: 1, minHeight: 0, gap: 12 },
	elsewhere: { gap: 8, padding: 16 },
	elsewhereText: { fontFamily: font.extraBold, fontSize: 15 },
})
