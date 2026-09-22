import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { DotBadge } from "@/components/ui/badge"
import { ScreenHeader } from "@/components/ui/header"
import { Screen } from "@/components/ui/screen"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { noticesQueryOptions } from "@/hooks/apis/notices"
import { formatDate } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { Notice } from "@/types/apis/notices"
import type { RootStackParamList } from "@/types/navigation"

export function NoticeListScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const notices = useInfiniteQuery(noticesQueryOptions())

	function renderItem({ item }: { item: Notice }) {
		const date = formatDate(item.starts_at, locale)

		return (
			<PressableSurface
				accessibilityLabel={[
					item.title,
					date,
					item.is_read ? null : t("settings.notices.unread"),
				]
					.filter(Boolean)
					.join(", ")}
				depth={2}
				onPress={() => navigation.navigate("NoticeDetail", { noticeId: item.id })}
				contentStyle={styles.card}
			>
				<View style={styles.lines}>
					<Copy style={styles.title} numberOfLines={2}>
						{item.title}
					</Copy>
					<Copy style={styles.date}>{date}</Copy>
				</View>
				{item.is_read ? null : <DotBadge />}
			</PressableSurface>
		)
	}

	function body() {
		if (notices.isError) {
			return (
				<ScreenError
					message={t("common.loadError")}
					onRetry={() => void notices.refetch()}
				/>
			)
		}

		if (!notices.data) {
			return <Skeleton rows={3} />
		}

		return (
			<FlatList
				data={notices.data.pages.flatMap((page) => page.data)}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				onEndReached={() => {
					if (notices.hasNextPage) {
						void notices.fetchNextPage()
					}
				}}
				contentContainerStyle={styles.list}
				ListEmptyComponent=<EmptyState message={t("settings.notices.empty")} />
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={styles.frame}>
				<ScreenHeader
					title={t("settings.notices.title")}
					onBack={() => navigation.goBack()}
				/>
				{body()}
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	frame: {
		flex: 1,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 20,
	},
	list: { gap: 12, paddingBottom: 32 },
	card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
	lines: { flex: 1, minWidth: 0, gap: 4 },
	title: { fontFamily: font.extraBold, fontSize: 16 },
	date: { fontSize: 13, color: colors.muted },
})
