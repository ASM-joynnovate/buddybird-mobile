import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet, View } from "react-native"

import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { useDevices } from "@/hooks/use-devices"
import { DeviceCard } from "@/screens/Settings/components/device-card"
import { DisconnectDeviceDialog } from "@/screens/Settings/components/disconnect-device-dialog"
import { RenameDeviceDialog } from "@/screens/Settings/components/rename-device-dialog"
import { useDeviceActions } from "@/screens/Settings/hooks/use-device-actions"
import type { RootStackParamList } from "@/types/navigation"

export function DevicesScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { devices, isError, retry } = useDevices()

	const actions = useDeviceActions()

	const target = actions.target

	function body() {
		if (isError) {
			return <ScreenError message={t("common.loadError")} onRetry={retry} />
		}

		if (!devices) {
			return <Skeleton rows={2} height={110} />
		}

		return (
			<FlatList
				data={devices}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				renderItem={({ item }) => (
					<DeviceCard
						device={item}
						onRename={() => actions.open("rename", item)}
						onDisconnect={() => actions.open("disconnect", item)}
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
			{target?.kind === "rename" ? (
				<RenameDeviceDialog
					device={target.device}
					state={actions.rename}
					onSave={actions.rename.save}
					onClose={actions.close}
				/>
			) : null}
			{target?.kind === "disconnect" ? (
				<DisconnectDeviceDialog
					device={target.device}
					state={actions.disconnect}
					onConfirm={actions.disconnect.confirm}
					onClose={actions.close}
				/>
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
