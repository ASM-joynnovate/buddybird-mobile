import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChevronLeftIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	period: string;
}

/**
 * 학습 상세 예시의 제목 컴포넌트
 * @param period 학습 시작 및 종료 시각 문구
 */
const GuideSceneSessionPreviewHeader = ({ period }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.header}>
			<View style={styles.back}>
				<ChevronLeftIcon size={24} color={colors.text} />
			</View>

			<View style={styles.headText}>
				<Copy style={styles.title}>{t('report.detail.title')}</Copy>
				<Copy numberOfLines={1} style={styles.period}>
					{period}
				</Copy>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: -12, paddingBottom: 4 },
	back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
	headText: { flex: 1, minWidth: 0 },
	title: { fontFamily: font.bold, fontSize: 20, lineHeight: 26 },
	period: {
		fontFamily: font.medium,
		fontSize: 13,
		lineHeight: 18,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
});

export default GuideSceneSessionPreviewHeader;
