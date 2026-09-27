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
import type { RootStackParamList } from "@/types/navigation"

export function DevicesScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { devices, isError, retry } = useDevices()

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
				renderItem={({ item }) => <DeviceCard device={item} />}
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
