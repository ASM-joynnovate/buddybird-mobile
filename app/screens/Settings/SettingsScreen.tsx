import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ScreenHeader } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { noticesQueryOptions } from "@/hooks/apis/notices"
import { usePermission } from "@/hooks/use-permission"
import { AccountActions } from "@/screens/Settings/components/account-actions"
import { NotificationGroup } from "@/screens/Settings/components/notification-group"
import { GeneralGroup, SupportGroup } from "@/screens/Settings/components/settings-groups"
import { SleepTimeRow } from "@/screens/Settings/components/sleep-time-row"
import { useSettingsUpdate } from "@/screens/Settings/hooks/use-settings-update"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { useFeedbackStore } from "@/stores/feedback"
import type { RootStackParamList } from "@/types/navigation"

export function SettingsScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const locale = useDeviceSettingsStore((state) => state.locale)
	const isAnonymous = useAccountStore((account) => account.isAnonymous)

	const feedback = useFeedbackStore()

	const notificationPermission = usePermission("notifications")

	const notices = useInfiniteQuery(noticesQueryOptions())

	const form = useSettingsUpdate()
	const settings = form.settings

	const [openWheel, setOpenWheel] = useState<"sleep_at" | "wake_at" | null>(null)

	const toggleWheel = (key: "sleep_at" | "wake_at") =>
		setOpenWheel((current) => (current === key ? null : key))

	function preferences() {
		if (form.loadFailed) {
			return <ScreenError message={t("common.loadError")} onRetry={form.retry} />
		}

		if (!settings) {
			return <Skeleton rows={3} height={56} />
		}

		return (
			<>
				<GroupedList title={t("settings.care.title")}>
					<SleepTimeRow
						first
						icon="moon"
						label={t("settings.care.sleep")}
						value={settings.sleep.sleep_at}
						locale={locale}
						open={openWheel === "sleep_at"}
						onToggle={() => toggleWheel("sleep_at")}
						onChange={(value) =>
							form.updateSleep({ ...settings.sleep, sleep_at: value })
						}
					/>
					<SleepTimeRow
						icon="sun"
						label={t("settings.care.wake")}
						value={settings.sleep.wake_at}
						locale={locale}
						open={openWheel === "wake_at"}
						onToggle={() => toggleWheel("wake_at")}
						onChange={(value) =>
							form.updateSleep({ ...settings.sleep, wake_at: value })
						}
					/>
				</GroupedList>
				<NotificationGroup
					settings={settings}
					permissionOff={notificationPermission.granted === false}
					onOpenPermissions={() => navigation.navigate("Permissions")}
					onChange={(key, value) =>
						form.updateNotifications({ ...settings.notifications, [key]: value })
					}
				/>
				<InlineError message={form.failed ? t("settings.saveError") : null} />
			</>
		)
	}

	return (
		<Screen>
			<ScreenHeader title={t("settings.title")} onBack={() => navigation.goBack()} />
			<View style={styles.sections}>
				{preferences()}
				<GeneralGroup
					onOpenDevices={() => navigation.navigate(isAnonymous ? "Login" : "Devices")}
					onOpenPermissions={() => navigation.navigate("Permissions")}
				/>
				<AccountActions onSignIn={() => navigation.navigate("Login")} />
				<SupportGroup
					unreadNotice={Boolean(
						notices.data?.pages.some((page) =>
							page.data.some((notice) => !notice.is_read),
						),
					)}
					onFeedback={() => feedback.open("profile")}
					onOpenNotices={() => navigation.navigate("NoticeList")}
					onOpenConsents={() => navigation.navigate("ConsentSettings")}
				/>
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	sections: { gap: 28 },
})
