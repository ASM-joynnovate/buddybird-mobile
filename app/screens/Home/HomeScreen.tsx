import { type CompositeNavigationProp, useIsFocused, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/states"
import { SCREEN_REFRESH_MS } from "@/config"
import { homeSummaryQueryOptions } from "@/hooks/apis/home"
import { NoticePopup } from "@/screens/Home/components/notice-popup"
import { useNoticePopup } from "@/screens/Home/hooks/use-notice-popup"
import { useStaleStationCleanup } from "@/screens/Home/hooks/use-stale-station-cleanup"
import { TakeoverDialog } from "@/screens/Session/components/start-dialogs"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

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
		refetchInterval: focused ? SCREEN_REFRESH_MS : false,
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

	return (
		<Screen scroll={false}>
			<View style={styles.screen}>
				<View style={styles.body}>
					{summary.isError ? (
						<ScreenError
							message={t("common.loadError")}
							onRetry={() => void summary.refetch()}
						/>
					) : null}
				</View>
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
