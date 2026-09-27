import type { LucideIcon } from "lucide-react-native"
import { View } from "react-native"

import { rowStyles } from "@/components/ui/rows/styles"
import { Copy } from "@/components/ui/text"
import { colors } from "@/theme"

interface Props {
	label: string
	icon?: LucideIcon
	detail?: string
}

export interface RowProps extends Props {
	first?: boolean
}

export function RowLabel({ label, icon: Icon, detail }: Props) {
	return (
		<>
			{Icon ? <Icon size={22} color={colors.muted} /> : null}
			<View style={rowStyles.labels}>
				<Copy style={rowStyles.label}>{label}</Copy>
				{detail ? <Copy style={rowStyles.detail}>{detail}</Copy> : null}
			</View>
		</>
	)
}
