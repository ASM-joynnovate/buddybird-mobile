import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import type { Device } from "@/apis/devices"
import { ScreenHeader } from "@/components/ui/header"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { devicesQueryOptions } from "@/hooks/apis/devices"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { DeviceCard } from "@/screens/Settings/components/device-card"
import {
	DisconnectDeviceDialog,
	RenameDeviceDialog,
} from "@/screens/Settings/components/device-dialogs"
import type { RootStackParamList } from "@/types/navigation"

type Action = { kind: "rename" | "disconnect"; device: Device } | null

export function DevicesScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const locale = useDeviceSetting("locale")
	const devices = useQuery(devicesQueryOptions())
	const [action, setAction] = useState<Action>(null)
	const close = () => setAction(null)

	function body() {
		if (devices.isError) {
			return (
				<ScreenError
					message={t("common.loadError")}
					onRetry={() => void devices.refetch()}
				/>
			)
		}

		if (!devices.data) {
			return <Skeleton rows={2} height={110} />
		}

		return (
			<FlatList
				data={devices.data}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				renderItem={({ item }) => (
					<DeviceCard
						device={item}
						locale={locale}
						onRename={() => setAction({ kind: "rename", device: item })}
						onDisconnect={() => setAction({ kind: "disconnect", device: item })}
					/>
				)}
			/>
		)
	}

	return (
		<Screen scroll={false}>
			<View style={styles.frame}>
				<ScreenHeader
					title={t("settings.devices.title")}
					onBack={() => navigation.goBack()}
				/>
				{body()}
			</View>
			{action?.kind === "rename" ? (
				<RenameDeviceDialog device={action.device} onClose={close} />
			) : null}
			{action?.kind === "disconnect" ? (
				<DisconnectDeviceDialog device={action.device} onClose={close} />
			) : null}
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
})
