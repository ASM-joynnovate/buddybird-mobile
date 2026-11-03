import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import ReportGuideLogKind from '@/screens/report/components/report-guide/log-kind';

/** 소리 기록 종류 안내 컴포넌트 */
const ReportGuideSoundKinds = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.kinds}>
			<ReportGuideLogKind
				kind="mimic"
				name={t('report.guide.soundKinds.mimic')}
				detail={t('report.guide.soundKinds.mimicDetail')}
			/>
			<ReportGuideLogKind
				kind="parrot"
				name={t('report.detail.kinds.parrot')}
				detail={t('report.guide.soundKinds.parrotDetail')}
			/>
			<ReportGuideLogKind
				kind="distressCall"
				name={t('report.detail.kinds.distressCall')}
				detail={t('report.guide.soundKinds.distressCallDetail')}
				emergencyShown
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	kinds: { gap: 8 },
});

export default ReportGuideSoundKinds;
