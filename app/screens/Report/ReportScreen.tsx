import { type RouteProp, useIsFocused, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { type ReactElement, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { SCREEN_REFRESH_MS } from "@/config"
import { reportQueryOptions } from "@/hooks/apis/reports"
import { hasRecords, ReportHeader } from "@/screens/Report/components/report-header"
import { SessionRow } from "@/screens/Report/components/session-row"
import { useReportPeriod } from "@/screens/Report/hooks/use-report-period"
import { track } from "@/services/telemetry/client"
import { useAccountStore } from "@/stores/account"
import { colors, font } from "@/theme"
import type { ReportStackParamList, RootStackParamList } from "@/types/navigation"

export function ReportScreen(): ReactElement {
	const { t } = useTranslation()

	const route = useRoute<RouteProp<ReportStackParamList, "Report">>()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const focused = useIsFocused()

	const isAnonymous = useAccountStore((account) => account.isAnonymous)

	const period = useReportPeriod(route.params)

	const report = useQuery({
		...reportQueryOptions(period.period, period.start),
		refetchInterval: (query) =>
			focused &&
			query.state.data?.sessions.some((session) => session.judgment_status === "pending")
				? SCREEN_REFRESH_MS
				: false,
	})

	const viewedPeriod = useRef<string | null>(null)
	const recordedNotificationParams = useRef<object | null>(null)

	const recorded = report.data !== undefined && hasRecords(report.data)

	useEffect(() => {
		if (!focused) {
			viewedPeriod.current = null

			return
		}

		const shownPeriod = `${period.period}:${period.start}`
		const openedFromNotification =
			route.params?.source === "notification" &&
			recordedNotificationParams.current !== route.params

		if (!report.data || (viewedPeriod.current === shownPeriod && !openedFromNotification)) {
			return
		}

		viewedPeriod.current = shownPeriod
		recordedNotificationParams.current = route.params ?? null

		track("report_viewed", {
			period: period.period,
			periods_ago: period.periodsAgo,
			source: openedFromNotification ? "notification" : "tab",
			session_count: report.data.sessions.length,
		})
	}, [focused, period.period, period.periodsAgo, period.start, report.data, route.params])

	function openSession(sessionId: string) {
		navigation.navigate("Main", {
			screen: "ReportTab",
			params: { screen: "SessionDetail", params: { sessionId, source: "report" } },
		})
	}

	const header = (
		<ReportHeader
			state={period}
			report={report.data}
			failed={report.isError}
			onRetry={() => void report.refetch()}
			onStart={() => navigation.navigate("Main", { screen: "HomeTab" })}
		/>
	)

	const footer =
		report.data && recorded ? (
			<View style={ui.section}>
				<View style={styles.mimicryTitle}>
					<Copy accessibilityRole="header" style={[ui.sectionTitle, styles.grow]}>
						{t("report.sounds")}
					</Copy>
					{isAnonymous ? null : (
						<Copy style={styles.mimicryCount}>
							{t("report.mimicry", { count: report.data.mimicry.count })}
						</Copy>
					)}
				</View>
				{isAnonymous ? (
					<View style={styles.locked}>
						<Copy style={styles.none}>{t("auth.signInRequired")}</Copy>
						<Button
							label={t("auth.signIn")}
							variant="secondary"
							onPress={() => navigation.navigate("Login")}
						/>
					</View>
				) : null}
			</View>
		) : null

	return (
		<Screen scroll={false}>
			<FlatList
				data={recorded ? report.data?.sessions : []}
				keyExtractor={(session) => session.id}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				refreshing={report.isRefetching}
				onRefresh={() => void report.refetch()}
				ListHeaderComponent={header}
				ListFooterComponent={footer}
				renderItem={({ item }) => (
					<SessionRow
						session={item}
						judging={!isAnonymous && item.judgment_status === "pending"}
						onPress={() => openSession(item.id)}
					/>
				)}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	content: {
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
		paddingBottom: 24,
		gap: 10,
	},
	none: { color: colors.muted },
	locked: { gap: 12 },
	mimicryTitle: { flexDirection: "row", alignItems: "baseline", gap: 8 },
	grow: { flex: 1 },
	mimicryCount: { fontFamily: font.extraBold, fontSize: 15, color: colors.orangeDark },
})
