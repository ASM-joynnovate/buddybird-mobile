import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { night } from "@/screens/Session/components/night"

type Item = { key: string; icon: IconName; problem: boolean; label: string }

export function RunStatus({
	online,
	microphone,
	camera,
}: {
	online: boolean | null
	microphone: boolean | null
	camera: boolean | null
}) {
	const { t } = useTranslation()
	const items: Item[] = [
		{
			key: "network",
			icon: online === false ? "wifiOff" : "wifi",
			problem: online === false,
			label: t(online === false ? "session.run.offline" : "session.run.online"),
		},
		{
			key: "battery",
			icon: "battery",
			problem: false,
			label: t("session.run.batteryUnknown"),
		},
		{
			key: "microphone",
			icon: microphone === false ? "micOff" : "mic",
			problem: microphone === false,
			label: t(microphone === false ? "session.run.micOff" : "session.run.micOn"),
		},
		{
			key: "camera",
			icon: camera === false ? "cameraOff" : "camera",
			problem: camera === false,
			label: t(camera === false ? "session.run.cameraOff" : "session.run.cameraOn"),
		},
	]

	return (
		<View style={styles.row}>
			{items.map((item) => (
				<View key={item.key} accessible accessibilityLabel={item.label}>
					<Icon
						name={item.icon}
						size={22}
						color={item.problem ? night.warn : night.faint}
					/>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 14 },
})
