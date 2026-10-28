import type { ReactNode } from 'react';

import { View } from 'react-native';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	message: string;
	illustration?: ReactNode;
}

export const EmptyState = ({ message, illustration }: Props) => {
	return (
		<View style={ui.messageContainer}>
			{illustration}
			<Copy style={ui.messageText}>{message}</Copy>
		</View>
	);
};
