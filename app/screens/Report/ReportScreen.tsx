import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { SoundRow } from "@/components/session/sound-row"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { reportQueryOptions } from "@/hooks/apis/reports"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { useSoundsWithAnalysis } from "@/hooks/use-sounds-with-analysis"
import { formatDateTime, formatTime } from "@/i18n/format"
import { hasRecords, ReportHeader } from "@/screens/Report/components/report-header"
import { SessionRow } from "@/screens/Report/components/session-row"
import { useReportPeriod } from "@/screens/Report/hooks/use-report-period"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { ReportStackParamList, RootStackParamList } from "@/types/navigation"

export function ReportScreen(): ReactElement {
	const { t } = useTranslation()

	const route = useRoute<RouteProp<ReportStackParamList, "Report">>()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const locale = useDeviceSettingsStore((state) => state.locale)
	const isAnonymous = useAccountStore((account) => account.isAnonymous)

	const player = useSoundPlayer()

	const period = useReportPeriod(route.params)

	const report = useQuery(reportQueryOptions(period.period, period.start))

	const recorded = report.data !== undefined && hasRecords(report.data)
	const reportSounds = report.data && recorded && !isAnonymous ? report.data.mimicry.sounds : []
	const sounds = useSoundsWithAnalysis(reportSounds).soundsWithAnalysis ?? []
	const formatSoundTime = period.period === "day" ? formatTime : formatDateTime

	function openSession(sessionId: string, soundId?: string) {
		navigation.navigate("Main", {
			screen: "ReportTab",
			params: { screen: "SessionDetail", params: { sessionId, soundId } },
		})
	}

	let mimicryBody: ReactElement | ReactElement[] = (
		<Copy style={styles.none}>{t("report.noSounds")}</Copy>
	)

	if (isAnonymous) {
		mimicryBody = (
			<View style={styles.locked}>
				<Copy style={styles.none}>{t("auth.signInRequired")}</Copy>
				<Button
					label={t("auth.signIn")}
					variant="secondary"
					onPress={() => navigation.navigate("Login")}
				/>
			</View>
		)
	} else if (sounds.length > 0) {
		mimicryBody = sounds.map((sound) => (
			<SoundRow
				key={sound.id}
				sound={sound}
				timeLabel={formatSoundTime(sound.captured_at, locale)}
				player={player}
				onPress={() => openSession(sound.session_id, sound.id)}
			/>
		))
	}

	const header = (
		<ReportHeader
			state={period}
			report={report.data}
			failed={report.isError}
			locale={locale}
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
				{mimicryBody}
			</View>
		) : null

	return (
		<Screen scroll={false}>
			<FlatList
				data={recorded ? report.data?.sessions : []}
				keyExtractor={(session) => session.id}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={header}
				ListFooterComponent={footer}
				renderItem={({ item }) => (
					<SessionRow session={item} onPress={() => openSession(item.id)} />
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
