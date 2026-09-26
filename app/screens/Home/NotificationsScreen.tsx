import { useNavigation } from "@react-navigation/native"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native"

import { Illustration } from "@/components/illustration"
import { ScreenHeader, TextButton } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { Screen } from "@/components/ui/screen"
import { EmptyState, ScreenError, Skeleton } from "@/components/ui/states"
import { noticeNotificationsQueryOptions } from "@/hooks/apis/mocks"
import {
	notificationsQueryOptions,
	readAllNotificationsMutationOptions,
} from "@/hooks/apis/notifications"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import type { InboxNotification } from "@/mocks/types"
import { NotificationItem } from "@/screens/Home/components/notification-item"
import { useOpenNotification } from "@/screens/Home/hooks/use-open-notification"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors } from "@/theme"

export function NotificationsScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const open = useOpenNotification()

	const list = useInfiniteQuery(notificationsQueryOptions())
	const noticeNotifications = useQuery(noticeNotificationsQueryOptions())

	const readAll = useIdempotentMutation(readAllNotificationsMutationOptions())

	const items: InboxNotification[] = [
		...(list.data?.pages.flatMap((page) => page.data) ?? []),
		...(noticeNotifications.data?.notices ?? []),
	].sort((a, b) => Date.parse(b.sent_at) - Date.parse(a.sent_at))
	const hasUnread = items.some((item) => !item.read_at)

	let empty = <Skeleton rows={5} />

	if (list.isError) {
		empty = <ScreenError message={t("common.loadError")} onRetry={() => void list.refetch()} />
	} else if (list.data) {
		empty = (
			<EmptyState
				message={t("home.notification.empty")}
				illustration=<Illustration
					scene={t("home.notification.emptyScene")}
					icon="bell"
					height={180}
				/>
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={styles.header}>
				<ScreenHeader
					title={t("home.notification.title")}
					onBack={() => navigation.goBack()}
					right=<TextButton
						label={t("home.notification.readAll")}
						disabled={!hasUnread || readAll.isPending}
						onPress={() => readAll.mutate({})}
					/>
				/>
				<InlineError
					message={readAll.isError ? t("home.notification.readAllError") : null}
				/>
			</View>
			<FlatList
				data={items}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<NotificationItem item={item} locale={locale} onOpen={open} />
				)}
				ListEmptyComponent={empty}
				onEndReachedThreshold={0.4}
				onEndReached={() => {
					if (list.hasNextPage && !list.isFetchingNextPage) {
						void list.fetchNextPage()
					}
				}}
				ListFooterComponent={
					list.isFetchingNextPage ? <ActivityIndicator color={colors.orange} /> : null
				}
				contentContainerStyle={styles.list}
				showsVerticalScrollIndicator={false}
			/>
		</Screen>
	)
}

const styles = StyleSheet.create({
	header: {
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	list: {
		flexGrow: 1,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
		paddingHorizontal: 24,
		paddingBottom: 32,
	},
})
