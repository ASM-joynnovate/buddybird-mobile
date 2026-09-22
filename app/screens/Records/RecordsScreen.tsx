import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Illustration } from "@/components/illustration"
import { ScreenHeader } from "@/components/ui/header"
import { Screen } from "@/components/ui/screen"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { formatDateWithWeekday } from "@/i18n/format"
import { DayRuler } from "@/screens/Records/components/day-ruler"
import { MonthCalendar } from "@/screens/Records/components/month-calendar"
import { SessionCard } from "@/screens/Records/components/session-card"
import {
	type CalendarSession,
	useRecordsCalendar,
} from "@/screens/Records/hooks/use-records-calendar"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import type { RecordsStackParamList } from "@/types/navigation"

export function RecordsScreen() {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const insets = useSafeAreaInsets()

	const navigation = useNavigation<NativeStackNavigationProp<RecordsStackParamList>>()

	const calendar = useRecordsCalendar()
	const { query, daySessions } = calendar

	const [highlightedId, setHighlightedId] = useState<string | null>(null)

	const list = useRef<FlatList<CalendarSession>>(null)

	function selectBar(id: string) {
		const index = daySessions.findIndex((item) => item.session.id === id)

		setHighlightedId(id)

		if (index >= 0) {
			list.current?.scrollToIndex({ index, viewPosition: 0.5 })
		}
	}

	function openSession(id: string) {
		setHighlightedId(id)

		navigation.navigate("SessionDetail", { sessionId: id })
	}

	function renderEmpty() {
		if (query.isPending) {
			return <Skeleton rows={2} />
		}

		if (query.isError) {
			return (
				<ScreenError message={t("common.loadError")} onRetry={() => void query.refetch()} />
			)
		}

		return (
			<EmptyState
				message={t("records.empty")}
				illustration=<Illustration scene={t("records.empty")} icon="records" height={160} />
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<FlatList
				ref={list}
				data={daySessions}
				keyExtractor={(item) => item.session.id}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
				ItemSeparatorComponent={Separator}
				onScrollToIndexFailed={({ index }) => {
					setTimeout(() => list.current?.scrollToIndex({ index, viewPosition: 0.5 }), 100)
				}}
				ListHeaderComponent={
					<View style={styles.header}>
						<ScreenHeader title={t("records.title")} large />
						<MonthCalendar
							month={calendar.month}
							selected={calendar.selected}
							marks={calendar.marks}
							canGoNext={calendar.canGoNext}
							onSelect={calendar.select}
							onPrevious={calendar.previousMonth}
							onNext={calendar.nextMonth}
						/>
						<Copy style={[ui.sectionTitle, ui.section]}>
							{formatDateWithWeekday(calendar.dayFrom, locale)}
						</Copy>
						{daySessions.length > 0 ? (
							<DayRuler
								from={calendar.dayFrom}
								bars={calendar.bars}
								alarms={calendar.alarms}
								highlightedId={highlightedId}
								onSelect={selectBar}
							/>
						) : null}
					</View>
				}
				ListEmptyComponent={renderEmpty()}
				renderItem={({ item }) => (
					<SessionCard
						item={item}
						now={calendar.now}
						highlighted={item.session.id === highlightedId}
						onPress={() => openSession(item.session.id)}
					/>
				)}
			/>
		</Screen>
	)
}

function Separator() {
	return <View style={styles.separator} />
}

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingTop: 20,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	header: { gap: 4, marginBottom: 16 },
	separator: { height: 12 },
})
