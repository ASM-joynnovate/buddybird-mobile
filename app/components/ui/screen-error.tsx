import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { Button } from '@/components/ui/button';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

interface Props {
	message: string;
	onRetry(): void;
}

export function ScreenError({ message, onRetry }: Props) {
	const { t } = useTranslation();

	return (
		<View style={ui.messageBox} accessibilityLiveRegion="polite">
			<TriangleAlertIcon size={32} color={colors.muted} />
			<Copy style={ui.messageText}>{message}</Copy>
			<Button
				label={t('common.retry')}
				variant="secondary"
				icon={RotateCwIcon}
				compact
				onPress={onRetry}
				style={styles.retry}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	retry: { alignSelf: 'flex-end' },
});
