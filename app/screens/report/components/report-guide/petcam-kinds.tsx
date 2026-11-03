import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import ReportGuideLogKind from '@/screens/report/components/report-guide/log-kind';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

/** 펫캠 기록 종류 안내 컴포넌트 */
const ReportGuidePetcamKinds = () => {
	const { t } = useTranslation();

	return (
		<View>
			<Copy style={styles.title}>{t('report.guide.petcamKinds.title')}</Copy>
			<View style={styles.kinds}>
				<ReportGuideLogKind
					kind="parrotDisappeared"
					name={t('report.detail.kinds.parrotDisappeared')}
					detail={t('report.guide.petcamKinds.parrotDisappearedDetail')}
				/>
				<ReportGuideLogKind
					kind="parrotAppeared"
					name={t('report.detail.kinds.parrotAppeared')}
					detail={t('report.guide.petcamKinds.parrotAppearedDetail')}
				/>
				<ReportGuideLogKind
					kind="parrotMotionless"
					name={t('report.detail.kinds.parrotMotionless')}
					detail={t('report.guide.petcamKinds.parrotMotionlessDetail')}
				/>
				<ReportGuideLogKind
					kind="parrotMoved"
					name={t('report.detail.kinds.parrotMoved')}
					detail={t('report.guide.petcamKinds.parrotMovedDetail')}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	title: {
		marginBottom: 8,
		paddingBottom: 8,
		borderBottomWidth: 2,
		borderBottomColor: colors.border,
		fontFamily: font.extraBold,
		fontSize: 14,
		lineHeight: 20,
	},
	kinds: { gap: 8 },
});

export default ReportGuidePetcamKinds;
