import { useTranslation } from "react-i18next"

import type { NotificationSetting, Settings } from "@/apis/settings"
import { GroupedList, NavRow, SwitchRow } from "@/components/ui/rows"
import type { SettingsMessages } from "@/i18n/types/settings"

const ITEMS: readonly {
	key: NotificationSetting
	label: keyof SettingsMessages["notifications"]
}[] = [
	{ key: "notify_emergency", label: "emergency" },
	{ key: "notify_mimicry", label: "mimicry" },
	{ key: "notify_daily_summary", label: "dailySummary" },
	{ key: "notify_streak", label: "streak" },
	{ key: "notify_station_disconnect", label: "stationDisconnect" },
]

export function NotificationGroup({
	settings,
	permissionOff,
	onOpenPermissions,
	onChange,
}: {
	settings: Settings
	permissionOff: boolean
	onOpenPermissions(): void
	onChange(key: NotificationSetting, value: boolean): void
}) {
	const { t } = useTranslation()

	return (
		<GroupedList title={t("settings.notifications.title")}>
			{permissionOff ? (
				<NavRow
					first
					icon="warning"
					label={t("settings.notifications.permissionLink")}
					detail={t("settings.notifications.permissionOff")}
					onPress={onOpenPermissions}
				/>
			) : null}
			{ITEMS.map(({ key, label }, index) => (
				<SwitchRow
					key={key}
					first={!permissionOff && index === 0}
					label={t(`settings.notifications.${label}`)}
					value={settings[key]}
					onChange={(value) => onChange(key, value)}
				/>
			))}
		</GroupedList>
	)
}
