import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ShareIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import type { LogItemKind } from '@/utils/session-log';

import SessionLogItemHead, { LOG_ITEM_LINES_INSET } from '@/components/session/log-item-head';
import { Copy } from '@/components/ui/copy';

const SIDE_PADDING = 14;

interface Props {
	kind: LogItemKind;
	name: string;
	value?: string;
	time: string;
	dividerShown?: boolean;
	children?: ReactNode;
}

/**
 * 학습 상세 예시의 기록 행 컴포넌트
 * @param kind 기록 종류
 * @param name 기록 이름
 * @param value 이름 옆에 표시할 값
 * @param time 기록 시각
 * @param dividerShown 위쪽 구분선 표시 여부
 * @param children 공유 버튼 위에 표시할 펼친 행의 내용
 */
const UsageSceneSessionPreviewItem = ({ kind, name, value, time, dividerShown = false, children }: Props) => {
	const { t } = useTranslation();

	const open = children !== undefined;

	return (
		<View style={[styles.item, open && styles.openItem]}>
			<SessionLogItemHead
				kind={kind}
				name={name}
				value={value}
				time={time}
				open={open}
				dividerShown={dividerShown}
			/>

			{open && (
				<View style={styles.panel}>
					{children}

					<View style={styles.share}>
						<ShareIcon size={17} strokeWidth={2.2} color={colors.text} />
						<Copy style={styles.shareLabel}>{t('report.detail.shareButton')}</Copy>
					</View>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	item: { paddingHorizontal: SIDE_PADDING },
	openItem: { backgroundColor: sessionDetailColors.openFace },
	panel: { paddingLeft: LOG_ITEM_LINES_INSET, paddingBottom: 18 },
	share: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		marginTop: 14,
		borderRadius: 12,
		backgroundColor: colors.background,
	},
	shareLabel: { fontFamily: font.semiBold, fontSize: 15, lineHeight: 20, color: colors.text },
});

export default UsageSceneSessionPreviewItem;
