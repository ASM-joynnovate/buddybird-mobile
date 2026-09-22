import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated"

import type { Session } from "@/apis/sessions"
import { CountBadge } from "@/components/ui/badge"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { formatDuration, formatRange, formatTime } from "@/i18n/format"
import { sessionEnd } from "@/screens/Records/hooks/use-records-calendar"
import { colors, font } from "@/theme"

type SessionCardProps = {
	session: Session
	now: number
	highlighted: boolean
	onPress(): void
}

export function SessionCard({ session, now, highlighted, onPress }: SessionCardProps) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const running = session.status === "running"
	const start = Date.parse(session.started_at)
	const end = sessionEnd(session, now)
	const title = session.learning_enabled && session.word ? session.word.name : null
	const range = running
		? `${formatTime(start, locale)} ~ ${t("records.card.now")}`
		: formatRange(start, end, locale)
	const duration = formatDuration(end - start, locale)

	return (
		<PressableSurface
			onPress={onPress}
			depth={highlighted ? 4 : 2}
			tone={running ? "selected" : "neutral"}
			color={highlighted || running ? colors.orange : undefined}
			accessibilityLabel={[
				title ?? t("records.card.learningOff"),
				range,
				duration,
				t("records.card.mimicry", { count: session.mimicry_count }),
				session.emergency_count > 0
					? t("records.card.emergency", { count: session.emergency_count })
					: null,
			]
				.filter(Boolean)
				.join(", ")}
			accessibilityState={{ selected: highlighted }}
			contentStyle={styles.card}
		>
			<View style={styles.info}>
				<Copy numberOfLines={1} style={[styles.title, !title && styles.off]}>
					{title ?? t("records.card.learningOff")}
				</Copy>
				<View style={styles.meta}>
					<Copy style={styles.small}>{range}</Copy>
					{running ? <LiveDot /> : null}
					<Copy style={styles.small}>{duration}</Copy>
				</View>
			</View>
			<View style={styles.badges}>
				<CountBadge
					count={session.mimicry_count}
					icon="mimicry"
					label={t("records.card.mimicry", { count: session.mimicry_count })}
				/>
				{session.emergency_count > 0 ? (
					<CountBadge
						count={session.emergency_count}
						tone="danger"
						label={t("records.card.emergency", { count: session.emergency_count })}
					/>
				) : null}
			</View>
		</PressableSurface>
	)
}

function LiveDot() {
	const reduced = useReducedMotion()
	const opacity = useSharedValue(1)
	const style = useAnimatedStyle(() => ({ opacity: opacity.get() }))

	useEffect(() => {
		opacity.set(reduced ? 1 : withRepeat(withTiming(0.2, { duration: 700 }), -1, true))
	}, [opacity, reduced])

	return <Animated.View style={[styles.live, style]} />
}

const styles = StyleSheet.create({
	card: { padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
	info: { flex: 1, minWidth: 0, gap: 4 },
	title: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	off: { color: colors.muted },
	meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 8 },
	small: {
		fontFamily: font.extraBold,
		fontSize: 13,
		color: colors.muted,
		fontVariant: ["tabular-nums"],
	},
	live: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.orange },
	badges: { flexDirection: "row", alignItems: "center", gap: 6 },
})
