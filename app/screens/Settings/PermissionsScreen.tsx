import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"

import type { IconName } from "@/components/ui/icon"
import { GroupedList } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { ScreenHeader } from "@/components/ui/screen-header"
import { PermissionRow } from "@/screens/Settings/components/permission-row"
import type { PermissionKind } from "@/services/device/permissions"
import type { RootStackParamList } from "@/types/navigation"

const ROWS: readonly { kind: PermissionKind; icon: IconName }[] = [
	{ kind: "microphone", icon: "mic" },
	{ kind: "notifications", icon: "bell" },
	{ kind: "photos", icon: "photo" },
]

export function PermissionsScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	return (
		<Screen>
			<ScreenHeader
				title={t("settings.permissions.title")}
				onBack={() => navigation.goBack()}
			/>
			<GroupedList>
				{ROWS.map(({ kind, icon }, index) => (
					<PermissionRow key={kind} kind={kind} icon={icon} first={index === 0} />
				))}
			</GroupedList>
		</Screen>
	)
}
