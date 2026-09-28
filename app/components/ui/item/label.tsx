import { View } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { itemStyles } from '@/components/ui/item/styles';

interface Props {
	label: string;
	icon?: LucideIcon;
	detail?: string;
}

export interface ItemBaseProps extends Props {
	first?: boolean;
}

export function ItemLabel({ label, icon: Icon, detail }: Props) {
	return (
		<>
			{Icon ? <Icon size={22} color={colors.muted} /> : null}
			<View style={itemStyles.labels}>
				<Copy style={itemStyles.label}>{label}</Copy>
				{detail ? <Copy style={itemStyles.detail}>{detail}</Copy> : null}
			</View>
		</>
	);
}
