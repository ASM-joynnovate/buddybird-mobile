import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { sessionQueryOptions } from "@/hooks/apis/sessions"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { formatDuration } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

export function SessionSummaryScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "SessionSummary">>()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const session = useQuery(sessionQueryOptions(params.sessionId))
	const words = useQuery(wordsQueryOptions())

	function openDetail() {
		navigation.reset({
			index: 0,
			routes: [
				{
					name: "Main",
					params: {
						screen: "ReportTab",
						params: {
							screen: "SessionDetail",
							params: { sessionId: params.sessionId },
							initial: false,
						},
					},
				},
			],
		})
	}

	let body = <Skeleton rows={3} height={56} />

	if (session.isError) {
		body = (
			<ScreenError message={t("common.loadError")} onRetry={() => void session.refetch()} />
		)
	} else if (session.data) {
		const { period, settings } = session.data
		const total = period.ended_at
			? Date.parse(period.ended_at) - Date.parse(period.started_at)
			: 0
		const word = words.data?.find((item) => item.id === settings.word_id)

		body = (
			<Card contentStyle={styles.card}>
				<SummaryLine label={t("session.summary.word")} value={word?.name ?? ""} />
				<SummaryLine
					label={t("session.summary.learning")}
					value={formatDuration(params.learningMs, locale)}
				/>
				<SummaryLine
					label={t("session.summary.total")}
					value={formatDuration(total, locale)}
				/>
			</Card>
		)
	}

	return (
		<Screen contentContainerStyle={styles.content}>
			<View style={styles.body}>{body}</View>
			<Button label={t("session.summary.detail")} icon="report" onPress={openDetail} />
		</Screen>
	)
}

interface Props {
	label: string
	value: string
}

function SummaryLine({ label, value }: Props) {
	return (
		<View style={styles.line} accessible accessibilityLabel={`${label} ${value}`}>
			<Copy style={styles.label}>{label}</Copy>
			<Copy style={styles.value}>{value}</Copy>
		</View>
	)
}

const styles = StyleSheet.create({
	content: { gap: 20 },
	body: { flex: 1, justifyContent: "center" },
	card: { padding: 20, gap: 16 },
	line: {
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		gap: 12,
	},
	label: { fontFamily: font.extraBold, fontSize: 15, color: colors.muted },
	value: { flexShrink: 1, fontFamily: font.black, fontSize: 22, color: colors.text },
})
