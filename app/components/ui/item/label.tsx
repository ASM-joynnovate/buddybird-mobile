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
			{/*아이콘*/}
			{Icon && <Icon size={22} color={colors.muted} />}

			{/*이름과 설명*/}
			<View style={itemStyles.textContainer}>
				<Copy style={itemStyles.label}>{label}</Copy>
				{!!detail && <Copy style={itemStyles.detail}>{detail}</Copy>}
			</View>
		</>
	);
};
