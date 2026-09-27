import { type CompositeNavigationProp, useIsFocused, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import {
	BellIcon,
	ClockIcon,
	MessageSquareTextIcon,
	MoonIcon,
	PlayIcon,
	SettingsIcon,
} from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { DurationPicker } from "@/components/session/duration-picker"
import { SleepTimeEditor } from "@/components/session/sleep-time-editor"
import { StartDialogs } from "@/components/session/start-dialogs"
import { WordPicker } from "@/components/session/word-picker"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList, PickerRow } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { TextButton } from "@/components/ui/text-button"
import { SCREEN_REFRESH_MS } from "@/config"
import { devicesQueryOptions } from "@/hooks/apis/devices"
import { homeSummaryQueryOptions } from "@/hooks/apis/home"
import { finishSessionMutationOptions } from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { usePermission } from "@/hooks/use-permission"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatClock, formatDurationWithDays } from "@/i18n/format"
import { NoticePopup } from "@/screens/Home/components/notice-popup"
import { useNoticePopup } from "@/screens/Home/hooks/use-notice-popup"
import { useSessionDraft } from "@/screens/Home/hooks/use-session-draft"
import { useStartSession } from "@/screens/Home/hooks/use-start-session"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { font } from "@/theme"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, "Home">,
	NativeStackNavigationProp<RootStackParamList>
>

export function HomeScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<Navigation>()
	const focused = useIsFocused()

	const locale = useDeviceSettingsStore((state) => state.locale)
	const clientDeviceId = useAccountStore((state) => state.clientDeviceId)

	const summary = useQuery({
		...homeSummaryQueryOptions(),
		refetchInterval: focused ? SCREEN_REFRESH_MS : false,
	})
	const devices = useQuery(devicesQueryOptions())

	const finishing = useIdempotentMutation(finishSessionMutationOptions())

	const session = useSessionDraft()

	const popup = useNoticePopup(summary.data?.unread_notices)

	const microphone = usePermission("microphone")

	const player = useSoundPlayer()

	const starter = useStartSession((sessionId, draft, endsAt) => {
		session.resetDraft()

		navigation.navigate("SessionRun", {
			sessionId,
			wordId: draft.wordId,
			endsAt,
			sleep: draft.sleep,
			duration: draft.duration,
			sleepChanged: draft.sleepChanged,
		})
	})

	const running = summary.data?.running_session ?? null
	const station = devices.data?.find((device) => device.id === running?.station.device_id)
	const runningElsewhere = station !== undefined && station.client_device_id !== clientDeviceId
	const unread = summary.data?.unread_notification_count ?? 0

	function start() {
		const draft = session.draft

		if (!draft) {
			return
		}

		player.stop()

		void microphone.run(() => starter.start(draft))
	}

	function wordSheet(close: () => void) {
		if (session.loading) {
			return <Skeleton rows={3} />
		}

		if (session.words.length === 0) {
			return (
				<EmptyState
					message={t("session.start.empty")}
					action={{
						label: t("session.start.addWord"),
						onPress: () => {
							close()

							navigation.navigate("Main", {
								screen: "WordsTab",
								params: { screen: "WordEditor" },
							})
						},
					}}
				/>
			)
		}

		return (
			<WordPicker
				words={session.words}
				selectedId={session.word?.id ?? null}
				player={player}
				onSelect={(id) => {
					session.selectWord(id)

					close()
				}}
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={styles.screen}>
				<View style={styles.top}>
					<IconButton
						icon={SettingsIcon}
						label={t("home.settings")}
						onPress={() => navigation.navigate("Settings")}
					/>
					<IconButton
						icon={BellIcon}
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
						<PickerRow
							row={{
								first: true,
								icon: MessageSquareTextIcon,
								label: t("session.start.word"),
								value: session.word?.name ?? t("session.start.choose"),
							}}
							sheet={{ title: t("session.start.word"), list: true }}
						>
							{wordSheet}
						</PickerRow>
						<PickerRow
							row={{
								icon: ClockIcon,
								label: t("session.start.duration"),
								value:
									session.duration.ms === null
										? t("session.start.untilEnd")
										: formatDurationWithDays(session.duration.ms, locale),
							}}
							sheet={{ title: t("session.start.duration") }}
						>
							{() => (
								<DurationPicker
									value={session.duration}
									onChange={session.setDuration}
								/>
							)}
						</PickerRow>
						<PickerRow
							row={{
								icon: MoonIcon,
								label: t("session.sleep.label"),
								value: session.sleep
									? t("session.sleep.range", {
											sleep: formatClock(session.sleep.sleep_at, locale),
											wake: formatClock(session.sleep.wake_at, locale),
										})
									: undefined,
								disabled: !session.sleep,
							}}
							sheet={{ title: t("session.sleep.label") }}
						>
							{() =>
								session.sleep ? (
									<SleepTimeEditor
										value={session.sleep}
										onChange={session.setSleep}
									/>
								) : null
							}
						</PickerRow>
					</GroupedList>
				</View>
				<Button
					label={t("common.start")}
					icon={PlayIcon}
					loading={starter.busy}
					disabled={!session.draft}
					onPress={start}
				/>
			</View>
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
