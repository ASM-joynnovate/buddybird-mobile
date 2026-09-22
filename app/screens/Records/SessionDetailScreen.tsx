import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SoundRow } from "@/components/session/sound-row"
import { Chip } from "@/components/ui/chip"
import { ScreenHeader } from "@/components/ui/header"
import { Screen } from "@/components/ui/screen"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { useSoundPlayer } from "@/hooks/use-sound-player"
import { formatDateTime, formatTime } from "@/i18n/format"
import { SessionOverview } from "@/screens/Records/components/session-overview"
import { EmergencyRow, EventRow } from "@/screens/Records/components/timeline-row"
import {
	timelineFilters,
	type TimelineItem,
	useSessionDetail,
} from "@/screens/Records/hooks/use-session-detail"
import type { RecordsStackParamList } from "@/types/navigation"

export function SessionDetailScreen() {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const insets = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<RecordsStackParamList>>()
	const { params } = useRoute<RouteProp<RecordsStackParamList, "SessionDetail">>()
	const player = useSoundPlayer()
	const detail = useSessionDetail(params.sessionId, params.soundId)
	const session = detail.session.data
	const timeline = detail.timeline.data
	const multiDay =
		session !== undefined &&
		new Date(session.started_at).toDateString() !== new Date(detail.end).toDateString()
	const timeLabel = (at: number | string) =>
		multiDay ? formatDateTime(at, locale) : formatTime(at, locale)

	function renderItem({ item }: { item: TimelineItem }) {
		const highlighted = item.key === detail.highlightedKey

		if (item.kind === "sound") {
			return (
				<SoundRow
					sound={item.sound}
					timeLabel={timeLabel(item.at)}
					player={player}
					highlighted={highlighted}
				/>
			)
		}

		if (item.kind === "emergency") {
			return (
				<EmergencyRow
					emergency={item.emergency}
					timeLabel={timeLabel(item.at)}
					highlighted={highlighted}
					onPress={() =>
						navigation.navigate("EmergencyDetail", { emergencyId: item.emergency.id })
					}
				/>
			)
		}

		return (
			<EventRow
				event={item.event}
				timeLabel={timeLabel(item.at)}
				endedByServer={session?.ended_by === "server"}
				highlighted={highlighted}
			/>
		)
	}

	function renderBody() {
		if (detail.session.isError || detail.timeline.isError) {
			return (
				<ScreenError
					message={t("common.loadError")}
					onRetry={() => {
						void detail.session.refetch()
						void detail.timeline.refetch()
					}}
				/>
			)
		}

		if (!session || !timeline) {
			return <Skeleton rows={4} />
		}

		return (
			<FlatList
				ref={detail.list}
				data={detail.items}
				keyExtractor={(item) => item.key}
				renderItem={renderItem}
				extraData={[detail.highlightedKey, player.playingId, player.finishedIds]}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
				onScrollToIndexFailed={({ index }) => detail.retryScroll(index)}
				ListHeaderComponent={
					<View style={styles.header}>
						<SessionOverview
							session={session}
							timeline={timeline}
							end={detail.end}
							running={detail.running}
							cursor={detail.cursor}
							onSelectKey={detail.scrollToKey}
							onSelectTime={detail.scrollToTime}
						/>
						<View style={styles.filters}>
							{timelineFilters.map((filter) => (
								<Chip
									key={filter}
									label={t(`records.detail.filters.${filter}`)}
									selected={detail.filter === filter}
									onPress={() => detail.setFilter(filter)}
								/>
							))}
						</View>
					</View>
				}
				ListEmptyComponent=<EmptyState message={t("records.detail.empty")} />
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={styles.content}>
				<ScreenHeader
					title={session ? formatDateTime(session.started_at, locale) : undefined}
					onBack={() => navigation.goBack()}
				/>
				{renderBody()}
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 20,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	header: { gap: 16, marginBottom: 12 },
	filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
})
