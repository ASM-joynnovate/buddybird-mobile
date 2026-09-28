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
		<View style={ui.messageBox} accessibilityLiveRegion="polite">
			{/*경고 아이콘과 불러오기 실패 문구*/}
			<TriangleAlertIcon size={32} color={colors.muted} />
			<Copy style={ui.messageText}>{t('common.loadError')}</Copy>

			{/*다시 시도 버튼*/}
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
