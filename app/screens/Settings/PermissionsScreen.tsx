import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"

import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { ScreenHeader } from "@/components/ui/header"
import { Icon, type IconName } from "@/components/ui/icon"
import { GroupedList, NavRow } from "@/components/ui/rows"
import { Screen } from "@/components/ui/screen"
import { usePermission } from "@/hooks/use-permission"
import type { PermissionKind } from "@/services/device/permissions"
import { reportError } from "@/services/telemetry/client"
import { colors } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

const ROWS: readonly { kind: PermissionKind; icon: IconName }[] = [
	{ kind: "microphone", icon: "mic" },
	{ kind: "notifications", icon: "bell" },
	{ kind: "photos", icon: "photo" },
]

function PermissionRow({
	kind,
	icon,
	first,
}: {
	kind: PermissionKind
	icon: IconName
	first: boolean
}) {
	const { t } = useTranslation()
	const permission = usePermission(kind)
	let status = t("settings.permissions.checking")

	if (permission.granted !== null) {
		status = t(
			permission.granted ? "settings.permissions.granted" : "settings.permissions.denied",
		)
	}

	return (
		<>
			<NavRow
				first={first}
				icon={icon}
				label={t(`common.permission.${kind}.name`)}
				value={status}
				disabled={permission.granted !== false}
				trailing={
					permission.granted ? (
						<Icon name="check" size={18} color={colors.orange} />
					) : undefined
				}
				onPress={() =>
					void permission
						.run(() => void permission.refresh())
						.catch((error: unknown) => reportError(error, `permission_${kind}`))
				}
			/>
			<PermissionDialog {...permission.dialog} />
		</>
	)
}

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
