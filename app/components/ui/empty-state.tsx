import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	message: string;
	illustration?: ReactNode;
	action?: { label: string; onPress: () => void };
}

export const EmptyState = ({ message, illustration, action }: Props) => {
	return (
		<View style={ui.messageContainer}>
			{illustration}
			<Copy style={ui.messageText}>{message}</Copy>

			{action && <Button label={action.label} onPress={action.onPress} style={styles.action} />}
		</View>
	);
};

const styles = StyleSheet.create({
	action: { alignSelf: 'stretch' },
});
