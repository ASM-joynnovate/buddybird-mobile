import { useTranslation } from "react-i18next"

import { GroupedList, NavRow, SwitchRow } from "@/components/ui/rows"
import type { SettingsMessages } from "@/i18n/types/settings"
import type { NotificationSetting, Settings } from "@/types/apis/settings"

const ITEMS: readonly {
	key: NotificationSetting
	label: keyof SettingsMessages["notifications"]
}[] = [
	{ key: "emergency", label: "emergency" },
	{ key: "mimicry", label: "mimicry" },
	{ key: "daily_summary", label: "dailySummary" },
	{ key: "streak", label: "streak" },
	{ key: "station_disconnect", label: "stationDisconnect" },
]

interface Props {
	settings: Settings
	permissionOff: boolean
	onOpenPermissions(): void
	onChange(key: NotificationSetting, value: boolean): void
}

export function NotificationGroup({ settings, permissionOff, onOpenPermissions, onChange }: Props) {
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
					value={settings.notifications[key]}
					onChange={(value) => onChange(key, value)}
				/>
			))}
		</GroupedList>
	)
}
