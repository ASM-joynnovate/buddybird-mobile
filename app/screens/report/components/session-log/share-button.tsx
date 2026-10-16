import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ShareIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	itemName: string;
	disabled: boolean;
	onPress: () => void;
}

/**
 * 펼친 기록의 공유 버튼 컴포넌트
 * @param itemName 기록 이름
 * @param disabled 비활성 여부
 * @param onPress 누르면 실행할 함수
 */
const SessionLogShareButton = ({ itemName, disabled, onPress }: Props) => {
	const { t } = useTranslation();

	const foregroundColor = disabled ? colors.subtle : colors.text;

	return (
		<PressableSurface
			accessibilityLabel={t('report.detail.share', { name: itemName })}
			disabled={disabled}
			onPress={onPress}
			depth="none"
			faceColor={colors.background}
			edgeColor={colors.background}
			style={styles.button}
			contentStyle={styles.face}
		>
			<ShareIcon size={17} strokeWidth={2.2} color={foregroundColor} />
			<Copy style={[styles.label, { color: foregroundColor }]}>{t('report.detail.shareButton')}</Copy>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	button: { marginTop: 14, borderRadius: 12 },
	face: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		borderWidth: 0,
		borderRadius: 12,
	},
	label: { fontFamily: font.semiBold, fontSize: 15, lineHeight: 20 },
});

export default SessionLogShareButton;
