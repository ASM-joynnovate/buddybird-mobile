import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

import MimicIcon from '@assets/images/icons/report/events/mimic.svg';
import SoundIcon from '@assets/images/icons/report/events/sound.svg';
import AlertIcon from '@assets/images/icons/report/stats/alert.svg';

const ICON_SIZE = 24;

/** 기록 종류 안내 컴포넌트 */
const ReportGuideLogKinds = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.kinds}>
			<View style={styles.kind}>
				<MimicIcon width={ICON_SIZE} height={ICON_SIZE} />
				<Copy style={styles.name}>{t('report.guide.logKinds.mimic')}</Copy>
				<Copy style={styles.detail}>{t('report.guide.logKinds.mimicDetail')}</Copy>
			</View>
			<View style={styles.kind}>
				<SoundIcon width={ICON_SIZE} height={ICON_SIZE} />
				<Copy style={styles.name}>{t('report.detail.kinds.parrot')}</Copy>
				<Copy style={styles.detail}>{t('report.guide.logKinds.parrotDetail')}</Copy>
			</View>
			<View style={styles.kind}>
				<AlertIcon width={ICON_SIZE} height={ICON_SIZE} />
				<Copy style={styles.name}>{t('report.detail.filters.emergency')}</Copy>
				<Copy style={styles.detail}>{t('report.guide.logKinds.emergencyDetail')}</Copy>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	kinds: { gap: 8 },
	kind: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	name: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 20 },
	detail: { flexShrink: 1, fontFamily: font.bold, fontSize: 12.5, lineHeight: 17, color: colors.muted },
});

export default ReportGuideLogKinds;
