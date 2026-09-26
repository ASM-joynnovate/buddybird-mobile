import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { SoundRow } from "@/components/session/sound-row"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { Copy } from "@/components/ui/text"
import { reportQueryOptions } from "@/hooks/apis/reports"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { useSoundsWithAnalysis } from "@/hooks/use-sounds-with-analysis"
import { formatDateTime, formatTime } from "@/i18n/format"
import { hasRecords, ReportHeader } from "@/screens/Report/components/report-header"
import { useReportPeriod } from "@/screens/Report/hooks/use-report-period"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors } from "@/theme"
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
	const reportSounds = report.data && recorded && !isAnonymous ? report.data.sounds : []
	const sounds = useSoundsWithAnalysis(reportSounds).soundsWithAnalysis ?? []
	const formatSoundTime = period.period === "day" ? formatTime : formatDateTime

	let emptySounds = null

	if (recorded && isAnonymous) {
		emptySounds = (
			<View style={styles.locked}>
				<Copy style={styles.none}>{t("auth.signInRequired")}</Copy>
				<Button
					label={t("auth.signIn")}
					variant="secondary"
					onPress={() => navigation.navigate("Login")}
				/>
			</View>
		)
	} else if (recorded) {
		emptySounds = <Copy style={styles.none}>{t("report.noSounds")}</Copy>
	}

	const header = (
		<ReportHeader
			state={period}
			report={report.data}
			failed={report.isError}
			locale={locale}
			onRetry={() => void report.refetch()}
			onStart={() => navigation.navigate("SessionStart")}
		/>
	)

	return (
		<Screen scroll={false}>
			<FlatList
				data={sounds}
				keyExtractor={(sound) => sound.id}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={header}
				renderItem={({ item }) => (
					<SoundRow
						sound={item}
						timeLabel={formatSoundTime(item.captured_at, locale)}
						player={player}
						onPress={() =>
							navigation.navigate("Main", {
								screen: "ReportTab",
								params: {
									screen: "SessionDetail",
									params: { sessionId: item.session_id, soundId: item.id },
								},
							})
						}
					/>
				)}
				ListEmptyComponent={emptySounds}
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
	},
	none: { color: colors.muted },
	locked: { gap: 12 },
})
