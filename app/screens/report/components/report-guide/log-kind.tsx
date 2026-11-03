import { StyleSheet, View } from 'react-native';

import type { LogItemKind } from '@/types/session-log';

import { useTranslation } from 'react-i18next';

import { colors, font } from '@/theme';

import SessionLogKindIcon from '@/components/session/session-log-kind-icon';
import { Copy } from '@/components/ui/copy';
import { Tag } from '@/components/ui/tag';

interface Props {
	kind: LogItemKind;
	name: string;
	detail: string;
	emergencyShown?: boolean;
}

/**
 * 기록 종류 항목 컴포넌트
 * @param kind 기록 종류
 * @param name 기록 이름
 * @param detail 기록되는 경우
 * @param emergencyShown 응급 상황 표시 여부
 */
const ReportGuideLogKind = ({ kind, name, detail, emergencyShown = false }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.kind}>
			<SessionLogKindIcon kind={kind} />
			<View style={styles.textContainer}>
				<View style={styles.nameRow}>
					<Copy style={styles.name}>{name}</Copy>
					{emergencyShown && <Tag label={t('report.detail.filters.emergency')} variant="danger" />}
				</View>
				<Copy style={styles.detail}>{detail}</Copy>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	kind: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	textContainer: { flexShrink: 1 },
	nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	name: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 14, lineHeight: 20 },
	detail: { fontFamily: font.bold, fontSize: 12.5, lineHeight: 17, color: colors.muted },
});

export default ReportGuideLogKind;
