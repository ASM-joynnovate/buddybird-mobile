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

export const ItemLabel = ({ label, icon: Icon, detail }: Props) => {
	return (
		<>
			{Icon && <Icon size={22} color={colors.muted} />}

			<View style={itemStyles.textContainer}>
				<Copy style={itemStyles.label}>{label}</Copy>
				{!!detail && <Copy style={itemStyles.detail}>{detail}</Copy>}
			</View>
		</>
	);
};
