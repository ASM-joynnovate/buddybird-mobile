import { CheckIcon, type LucideIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"

import { PermissionDialog } from "@/components/dialogs/permission-dialog"
import { NavRow } from "@/components/ui/rows"
import { usePermission } from "@/hooks/use-permission"
import type { PermissionKind } from "@/services/device/permissions"
import { reportError } from "@/services/telemetry/client"
import { colors } from "@/theme"

interface Props {
	kind: PermissionKind
	icon: LucideIcon
	first: boolean
}

export function PermissionRow({ kind, icon, first }: Props) {
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
					permission.granted ? <CheckIcon size={18} color={colors.orange} /> : undefined
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
