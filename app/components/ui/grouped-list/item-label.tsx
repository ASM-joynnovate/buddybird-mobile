import type { LucideIcon } from "lucide-react-native"
import { View } from "react-native"

import { groupedListStyles } from "@/components/ui/grouped-list/styles"
import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"

interface Props {
	label: string
	icon?: LucideIcon
	detail?: string
}

export interface GroupedListItemProps extends Props {
	first?: boolean
}

export function GroupedListItemLabel({ label, icon: Icon, detail }: Props) {
	return (
		<>
			{Icon ? <Icon size={22} color={colors.muted} /> : null}
			<View style={groupedListStyles.labels}>
				<Copy style={groupedListStyles.label}>{label}</Copy>
				{detail ? <Copy style={groupedListStyles.detail}>{detail}</Copy> : null}
			</View>
		</>
	)
}
