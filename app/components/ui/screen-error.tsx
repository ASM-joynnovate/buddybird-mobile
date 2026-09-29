import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	onRetry: () => void;
}

export const ScreenError = ({ onRetry }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={ui.messageContainer} accessibilityLiveRegion="polite">
			<TriangleAlertIcon size={32} color={colors.muted} />
			<Copy style={ui.messageText}>{t('common.loadError')}</Copy>

			<Button
				label={t('common.retry')}
				variant="secondary"
				icon={RotateCwIcon}
				size="small"
				onPress={onRetry}
				style={styles.retry}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	retry: { alignSelf: 'flex-end' },
});
