import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors, radius } from '@/theme';

import { Title } from '@/components/ui/title';

/** 학습 완료 제목을 불러오는 동안 보이는 컴포넌트 */
const SummaryTitleSkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Title style={styles.title}>{t('session.summary.title')}</Title>
			<View style={styles.rangeBlock} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 4 },
	title: { fontSize: 34, lineHeight: 40 },
	rangeBlock: {
		width: 120,
		height: 15,
		marginVertical: 2.5,
		borderRadius: radius.small,
		backgroundColor: colors.surface,
	},
});

export default SummaryTitleSkeleton;
