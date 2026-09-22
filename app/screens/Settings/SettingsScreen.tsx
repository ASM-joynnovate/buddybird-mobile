import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { ScreenHeader } from "@/components/ui/header"
import { InlineError } from "@/components/ui/inline-error"
import { GroupedList } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { noticesQueryOptions } from "@/hooks/apis/notices"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { useFeedbackDialog } from "@/hooks/use-feedback-dialog"
import { usePermission } from "@/hooks/use-permission"
import { AccountActions } from "@/screens/Settings/components/account-actions"
import { NotificationGroup } from "@/screens/Settings/components/notification-group"
import { GeneralGroup, SupportGroup } from "@/screens/Settings/components/settings-groups"
import { SleepTimeRow } from "@/screens/Settings/components/sleep-time-row"
import { useSettingsUpdate } from "@/screens/Settings/hooks/use-settings-update"
import type { RootStackParamList } from "@/types/navigation"

export function SettingsScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const locale = useDeviceSetting("locale")
	const feedback = useFeedbackDialog()
	const notificationPermission = usePermission("notifications")
	const notices = useQuery(noticesQueryOptions())
	const form = useSettingsUpdate()
	const [openWheel, setOpenWheel] = useState<"sleep_at" | "wake_at" | null>(null)
	const settings = form.settings
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
						value={settings.sleep_at}
						locale={locale}
						open={openWheel === "sleep_at"}
						onToggle={() => toggleWheel("sleep_at")}
						onChange={(value) => form.update({ sleep_at: value })}
					/>
					<SleepTimeRow
						icon="sun"
						label={t("settings.care.wake")}
						value={settings.wake_at}
						locale={locale}
						open={openWheel === "wake_at"}
						onToggle={() => toggleWheel("wake_at")}
						onChange={(value) => form.update({ wake_at: value })}
					/>
				</GroupedList>
				<NotificationGroup
					settings={settings}
					permissionOff={notificationPermission.granted === false}
					onOpenPermissions={() => navigation.navigate("Permissions")}
					onChange={(key, value) => form.update({ [key]: value })}
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
					onOpenDevices={() => navigation.navigate("Devices")}
					onOpenPermissions={() => navigation.navigate("Permissions")}
				/>
				<AccountActions />
				<SupportGroup
					unreadNotice={Boolean(notices.data?.some((notice) => !notice.is_read))}
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
