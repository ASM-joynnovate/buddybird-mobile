import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Illustration } from "@/components/illustration"
import { Chip } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { IconButton } from "@/components/ui/icon-button"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { ui } from "@/components/ui/styles"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatDate, formatDateWithWeekday, formatDuration, formatMonth } from "@/i18n/format"
import { TrendChart } from "@/screens/Report/components/trend-chart"
import { WordBars } from "@/screens/Report/components/word-bars"
import type { ReportPeriodState } from "@/screens/Report/hooks/use-report-period"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { Report, ReportPeriod } from "@/types/apis/reports"
import type { Locale } from "@/types/locale"

const periods: ReportPeriod[] = ["day", "week", "month"]

export function hasRecords(report: Report): boolean {
	return report.sessions.length > 0
}

function periodLabel(state: ReportPeriodState, locale: Locale): string {
	const start = new Date(`${state.start}T00:00:00`)

	if (state.period === "day") {
		return formatDateWithWeekday(start, locale)
	}

	if (state.period === "month") {
		return formatMonth(start, locale)
	}

	return `${formatDate(start, locale)} ~ ${formatDate(state.end, locale)}`
}

interface Props {
	state: ReportPeriodState
	report: Report | undefined
	failed: boolean
	onRetry(): void
	onStart(): void
}

export function ReportHeader({ state, report, failed, onRetry, onStart }: Props): ReactElement {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((settings) => settings.locale)

	const recorded = report ? hasRecords(report) : false
	const label = periodLabel(state, locale)
	const illustration = <Illustration scene={t("report.emptyScene")} icon="report" height={180} />

	return (
		<View>
			<ScreenHeader title={t("report.title")} large />
			<View style={ui.row}>
				{periods.map((period) => (
					<Chip
						key={period}
						label={t(`report.periods.${period}`)}
						selected={state.period === period}
						onPress={() => state.select(period)}
					/>
				))}
			</View>
			<Card style={styles.card}>
				<View style={ui.row}>
					<Copy accessibilityRole="header" style={styles.period}>
						{label}
					</Copy>
					<IconButton
						icon="back"
						label={t("report.previous")}
						onPress={() => state.move(-1)}
					/>
					<IconButton
						icon="forward"
						label={t("report.next")}
						disabled={state.isLatest}
						onPress={() => state.move(1)}
					/>
				</View>
				{!report && !failed ? <Skeleton rows={1} height={220} /> : null}
				{report && recorded ? (
					<>
						<Copy style={styles.label}>{t("report.learningTime")}</Copy>
						<View style={styles.totals}>
							<Copy adjustsFontSizeToFit numberOfLines={1} style={styles.total}>
								{formatDuration(report.learning_duration_ms, locale)}
							</Copy>
						</View>
						<TrendChart
							key={`${report.period}-${report.start}`}
							period={report.period}
							trend={report.trend}
						/>
					</>
				) : null}
			</Card>
			{failed ? <ScreenError message={t("common.loadError")} onRetry={onRetry} /> : null}
			{report && !recorded ? (
				<EmptyState
					message={t("report.empty")}
					illustration={illustration}
					action={{ label: t("report.startSession"), onPress: onStart }}
				/>
			) : null}
			{report && recorded ? (
				<>
					<WordBars words={report.words} />
					<Copy accessibilityRole="header" style={[ui.sectionTitle, styles.sessions]}>
						{t("report.sessions")}
					</Copy>
				</>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	card: { marginTop: 16 },
	period: { flex: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 16 },
	label: { marginTop: 12, fontFamily: font.extraBold, fontSize: 13.5, color: colors.muted },
	totals: { flexDirection: "row", alignItems: "baseline", gap: 12, marginBottom: 8 },
	total: { flex: 1, fontFamily: font.black, fontSize: 34, lineHeight: 40 },
	sessions: { marginTop: 24, marginBottom: 0 },
})
