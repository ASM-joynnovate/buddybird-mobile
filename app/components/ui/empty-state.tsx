import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

interface Props {
	message: string;
	illustration?: ReactNode;
	action?: { label: string; onPress(): void };
}

export function EmptyState({ message, illustration, action }: Props) {
	return (
		<View style={ui.messageBox}>
			{illustration}
			<Copy style={ui.messageText}>{message}</Copy>
			{action ? <Button label={action.label} onPress={action.onPress} style={styles.action} /> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	action: { alignSelf: 'stretch' },
});
