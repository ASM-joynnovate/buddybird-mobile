import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ShareIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Surface } from '@/components/ui/surface';

interface Props {
	feedShareShown: boolean;
}

/**
 * 학습 상세 예시의 공유 버튼 컴포넌트
 * @param feedShareShown 피드에 공유 버튼 표시 여부
 */
const GuideSceneSessionPreviewShares = ({ feedShareShown }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.shares}>
			<Surface cornerRadius="control" contentStyle={styles.shareFace}>
				<ShareIcon size={20} color={colors.text} />
			</Surface>
			{feedShareShown && (
				<Surface cornerRadius="control" style={styles.button} contentStyle={styles.buttonFace}>
					<Copy style={styles.buttonLabel}>{t('report.detail.shareToFeed')}</Copy>
				</Surface>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	shares: { flexDirection: 'row', gap: 10, marginTop: 12 },
	shareFace: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
	button: { flex: 1 },
	buttonFace: {
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingHorizontal: 14,
	},
	buttonLabel: {
		fontFamily: font.extraBold,
		fontSize: 16,
		letterSpacing: 0.32,
		textTransform: 'uppercase',
		color: colors.text,
	},
});

export default GuideSceneSessionPreviewShares;
