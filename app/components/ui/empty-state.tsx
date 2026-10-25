import { View } from 'react-native';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	message: string;
}

export const EmptyState = ({ message }: Props) => {
	return (
		<View style={ui.messageContainer}>
			<Copy style={ui.messageText}>{message}</Copy>
		</View>
	);
};
