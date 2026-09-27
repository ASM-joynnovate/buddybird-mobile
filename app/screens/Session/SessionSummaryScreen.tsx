import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { ChartNoAxesColumnIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { Skeleton } from "@/components/ui/skeleton"
import { Stat } from "@/components/ui/stat"
import { Card } from "@/components/ui/surface"
import { sessionQueryOptions } from "@/hooks/apis/sessions"
import { wordsQueryOptions } from "@/hooks/apis/words"
import { formatDuration } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
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
							params: { sessionId: params.sessionId, source: "summary" },
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
		const { period, word_id: wordId } = session.data
		const total = period.ended_at
			? Date.parse(period.ended_at) - Date.parse(period.started_at)
			: 0
		const word = words.data?.find((item) => item.id === wordId)

		body = (
			<Card contentStyle={styles.card}>
				<Stat size="large" label={t("session.summary.word")} value={word?.name ?? ""} />
				<Stat
					size="large"
					label={t("session.summary.total")}
					value={formatDuration(total, locale)}
				/>
			</Card>
		)
	}

	return (
		<Screen contentContainerStyle={styles.content}>
			<View style={styles.body}>{body}</View>
			<Button
				label={t("session.summary.detail")}
				icon={ChartNoAxesColumnIcon}
				onPress={openDetail}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	content: { gap: 20 },
	body: { flex: 1, justifyContent: "center" },
	card: { padding: 20, gap: 16 },
})
