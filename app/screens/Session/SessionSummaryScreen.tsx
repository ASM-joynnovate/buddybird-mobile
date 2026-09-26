import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { AbsenceStrip } from "@/components/session/absence-strip"
import { Button } from "@/components/ui/button"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatDuration } from "@/i18n/format"
import { Confetti } from "@/screens/Session/components/confetti"
import { BestMimicry, Greeting, Stat } from "@/screens/Session/components/summary-parts"
import { type SummaryData, useSummary } from "@/screens/Session/hooks/use-summary"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

export function SessionSummaryScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "SessionSummary">>()
	const summary = useSummary(params.sessionId)
	const wide = params.role === "station"

	function goHome() {
		navigation.reset({ index: 0, routes: [{ name: "Main" }] })
	}

	let body = <Skeleton rows={4} height={96} />

	if (summary.isError) {
		body = <ScreenError message={t("common.loadError")} onRetry={summary.retry} />
	} else if (summary.data) {
		body = <SummaryBody data={summary.data} wide={wide} />
	}

	return (
		<View style={styles.root}>
			<Screen contentContainerStyle={[styles.content, wide && styles.wide]}>
				<View style={styles.body}>{body}</View>
				<Button label={t("session.summary.home")} icon="home" onPress={goHome} />
			</Screen>
			{params.role === "viewer" ? <Confetti /> : null}
		</View>
	)
}

function SummaryBody({ data, wide }: { data: SummaryData; wide: boolean }) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const player = useSoundPlayer()

	const { record, strip, best } = data
	const duration = formatDuration(strip.end - strip.start, locale)

	function playSound(id: string) {
		const url = data.timeline.sounds.find((sound) => sound.id === id)?.audio.url

		if (url) {
			player.toggle(id, url)
		}
	}

	const stripCard = (
		<Card contentStyle={styles.strip}>
			<Copy style={styles.stripTitle}>{t("session.summary.stripTitle")}</Copy>
			<AbsenceStrip
				start={strip.start}
				end={strip.end}
				running={false}
				sleep={{ sleepAt: record.sleep.sleep_at, wakeAt: record.sleep.wake_at }}
				activity={strip.activity}
				sounds={strip.sounds}
				onSelectSound={playSound}
			/>
		</Card>
	)
	const stats = (
		<View style={styles.stats}>
			<Stat value={duration} label={t("session.summary.duration")} />
			<Stat
				value={t("session.summary.times", { count: record.playCount })}
				label={t("session.summary.plays")}
			/>
		</View>
	)
	const mimicry = best ? (
		<BestMimicry
			sound={best}
			count={record.mimicryCount}
			analyzing={data.analyzing}
			player={player}
		/>
	) : null

	return (
		<View style={styles.stack}>
			<Greeting
				message={
					data.parrotName
						? t("session.summary.greeting", { duration, name: data.parrotName })
						: t("session.summary.greetingNoName", { duration })
				}
			/>
			{wide ? (
				<View style={styles.columns}>
					<View style={styles.left}>{stripCard}</View>
					<View style={styles.right}>
						{mimicry}
						{stats}
					</View>
				</View>
			) : (
				<View style={[styles.stack, !best && styles.centered]}>
					{stripCard}
					{stats}
					{mimicry}
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	content: { gap: 20 },
	wide: { maxWidth: 960 },
	body: { flex: 1 },
	stack: { flex: 1, gap: 20 },
	centered: { justifyContent: "center" },
	columns: { flexDirection: "row", gap: 24, alignItems: "center" },
	left: { flex: 3, minWidth: 0 },
	right: { flex: 2, minWidth: 0, gap: 20 },
	strip: { gap: 10 },
	stripTitle: { fontFamily: font.black, fontSize: 18, color: colors.text },
	stats: { flexDirection: "row", gap: 12 },
})
