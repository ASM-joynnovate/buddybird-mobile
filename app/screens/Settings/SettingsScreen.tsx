import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useInfiniteQuery } from "@tanstack/react-query"
import { MoonIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { SleepTimeEditor } from "@/components/session/sleep-time-editor"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList, PickerRow } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { noticesQueryOptions } from "@/hooks/apis/notices"
import { usePermission } from "@/hooks/use-permission"
import { formatClock } from "@/i18n/format"
import { AccountActions } from "@/screens/Settings/components/account-actions"
import { GeneralGroup } from "@/screens/Settings/components/general-group"
import { NotificationGroup } from "@/screens/Settings/components/notification-group"
import { SupportGroup } from "@/screens/Settings/components/support-group"
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
					<PickerRow
						row={{
							first: true,
							icon: MoonIcon,
							label: t("session.sleep.label"),
							value: t("session.sleep.range", {
								sleep: formatClock(settings.sleep.sleep_at, locale),
								wake: formatClock(settings.sleep.wake_at, locale),
							}),
						}}
						sheet={{ title: t("session.sleep.label") }}
					>
						{() => (
							<SleepTimeEditor value={settings.sleep} onChange={form.updateSleep} />
						)}
					</PickerRow>
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
