import { type CompositeNavigationProp, useIsFocused, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { homeSummaryQueryOptions } from "@/hooks/apis/home"
import { homeExtrasQueryOptions } from "@/hooks/apis/mocks"
import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { useRunningSession } from "@/hooks/use-running-session"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { BuddyHint, MimicryBubble } from "@/screens/Home/components/mimicry-bubble"
import { NoticePopup } from "@/screens/Home/components/notice-popup"
import { ParrotPager } from "@/screens/Home/components/parrot-pager"
import { EmergencyLine, SessionLine } from "@/screens/Home/components/status-lines"
import { HomeTopBar } from "@/screens/Home/components/top-bar"
import { useNoticePopup, useStaleStationCleanup } from "@/screens/Home/hooks/use-home-startup"
import { TakeoverDialog } from "@/screens/Session/components/start-dialogs"
import type { HomeSummary } from "@/types/apis/home"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

const REFRESH_MS = 10_000

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, "Home">,
	NativeStackNavigationProp<RootStackParamList>
>

export function HomeScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<Navigation>()
	const focused = useIsFocused()
	const summary = useQuery({
		...homeSummaryQueryOptions(),
		refetchInterval: focused ? REFRESH_MS : false,
	})
	const popup = useNoticePopup(summary.data?.unread_notices)
	const [takeover, setTakeover] = useState(false)

	useStaleStationCleanup()

	function start() {
		if (summary.data?.running_session) {
			setTakeover(true)
		} else {
			navigation.navigate("SessionStart")
		}
	}

	let body = <Skeleton rows={4} height={110} />

	if (summary.isError) {
		body = (
			<ScreenError message={t("common.loadError")} onRetry={() => void summary.refetch()} />
		)
	} else if (summary.data) {
		body = <HomeBody summary={summary.data} navigation={navigation} />
	}

	return (
		<Screen scroll={false}>
			<View style={styles.screen}>
				<View style={styles.body}>{body}</View>
				<Button
					label={t("common.start")}
					icon="play"
					disabled={!summary.data}
					onPress={start}
				/>
			</View>
			<TakeoverDialog
				visible={takeover}
				onConfirm={() => {
					setTakeover(false)
					navigation.navigate("SessionStart", { replaceRunning: true })
				}}
				onClose={() => setTakeover(false)}
			/>
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

interface Props {
	summary: HomeSummary
	navigation: Navigation
}

function HomeBody({ summary, navigation }: Props) {
	const refetchInterval = useIsFocused() ? REFRESH_MS : false
	const player = useSoundPlayer()

	const parrots = useQuery(parrotsQueryOptions())
	const words = useQuery(wordsQueryOptions())
	const extras = useQuery({ ...homeExtrasQueryOptions(), refetchInterval })
	const running = useRunningSession(refetchInterval)

	const emergency = extras.data?.unconfirmed_emergency ?? null
	const mimicry = summary.latest_mimicry
	const mimicryWord = words.data?.find((word) => word.id === mimicry?.judgment?.word_id)

	return (
		<View style={styles.body}>
			<HomeTopBar
				streak={extras.data?.streak_days ?? 0}
				unread={summary.unread_notification_count}
				onNotifications={() => navigation.navigate("Notifications")}
				onSettings={() => navigation.navigate("Settings")}
			/>
			{running.detail ? (
				<SessionLine
					detail={running.detail}
					onPress={() => navigation.navigate("SessionMonitor")}
				/>
			) : null}
			{emergency ? (
				<EmergencyLine
					emergency={emergency}
					onPress={() =>
						navigation.navigate("Main", {
							screen: "RecordsTab",
							params: {
								screen: "EmergencyDetail",
								params: { emergencyId: emergency.id },
							},
						})
					}
				/>
			) : null}
			<ParrotPager
				parrots={parrots.data ?? []}
				onOpen={(parrotId) => navigation.navigate("ParrotEditor", { parrotId })}
			/>
			{mimicry ? (
				<MimicryBubble
					sound={mimicry}
					wordName={mimicryWord?.name ?? ""}
					player={player}
					onOpen={() =>
						navigation.navigate("Main", {
							screen: "RecordsTab",
							params: {
								screen: "SessionDetail",
								params: { sessionId: mimicry.session_id, soundId: mimicry.id },
							},
						})
					}
				/>
			) : (
				<BuddyHint />
			)}
		</View>
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
	body: { flex: 1, minHeight: 0, gap: 12 },
})
