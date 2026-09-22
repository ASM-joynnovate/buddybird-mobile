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
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatDuration, formatTime } from "@/i18n/format"
import { Confetti } from "@/screens/Session/components/confetti"
import {
	BestMimicry,
	EmergencyCard,
	Greeting,
	Stat,
} from "@/screens/Session/components/summary-parts"
import { type SummaryData, useSummary } from "@/screens/Session/hooks/use-summary"
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

	function openEmergency(emergencyId: string) {
		navigation.reset({
			index: 0,
			routes: [
				{
					name: "Main",
					params: {
						screen: "RecordsTab",
						params: { screen: "EmergencyDetail", params: { emergencyId } },
					},
				},
			],
		})
	}

	let body = <Skeleton rows={4} height={96} />

	if (summary.isError) {
		body = <ScreenError message={t("common.loadError")} onRetry={summary.retry} />
	} else if (summary.data) {
		body = <SummaryBody data={summary.data} wide={wide} onEmergency={openEmergency} />
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

function SummaryBody({
	data,
	wide,
	onEmergency,
}: {
	data: SummaryData
	wide: boolean
	onEmergency(id: string): void
}) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const player = useSoundPlayer()
	const { session, strip, emergencies, best } = data
	const duration = formatDuration(strip.end - strip.start, locale)
	const first = emergencies[0]

	function playSound(id: string) {
		const url = data.timeline.sounds.find((sound) => sound.id === id)?.audio_url

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
				sleep={{ sleepAt: session.sleep_at, wakeAt: session.wake_at }}
				activity={strip.activity}
				sounds={strip.sounds}
				emergencies={strip.emergencies}
				onSelectSound={playSound}
				onSelectEmergency={onEmergency}
			/>
		</Card>
	)
	const stats = (
		<View style={styles.stats}>
			<Stat value={duration} label={t("session.summary.duration")} />
			<Stat
				value={t("session.summary.times", { count: session.play_count })}
				label={t("session.summary.plays")}
			/>
		</View>
	)
	const mimicry = best ? (
		<BestMimicry
			sound={best}
			count={session.mimicry_count}
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
			{first ? (
				<EmergencyCard
					title={t("session.summary.emergency", {
						kind: t(`common.emergencyKinds.${first.kind}`),
						count: emergencies.length,
					})}
					time={formatTime(first.detected_at, locale)}
					onPress={() => onEmergency(first.id)}
				/>
			) : null}
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
