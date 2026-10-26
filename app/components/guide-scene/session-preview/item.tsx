import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import type { LogItemKind } from '@/types/session-log';

import { useTranslation } from 'react-i18next';

import { CheckIcon, ShareIcon, XIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import SessionLogItemHead from '@/components/session/session-log-item-head';
import { Copy } from '@/components/ui/copy';
import { Surface } from '@/components/ui/surface';

interface Props {
	kind: LogItemKind;
	name: string;
	value?: string;
	time: string;
	dividerShown?: boolean;
	feedShareShown?: boolean;
	children?: ReactNode;
}

/**
 * 학습 상세 예시의 기록 행 컴포넌트
 * @param kind 기록 종류
 * @param name 기록 이름
 * @param value 이름 옆에 표시할 값
 * @param time 기록 시각
 * @param dividerShown 위쪽 구분선 표시 여부
 * @param feedShareShown 피드에 공유 버튼 표시 여부
 * @param children 리뷰 버튼 위에 표시할 펼친 행의 내용
 */
const GuideSceneSessionPreviewItem = ({
	kind,
	name,
	value,
	time,
	dividerShown = false,
	feedShareShown = false,
	children,
}: Props) => {
	const { t } = useTranslation();

	const open = children !== undefined;

	return (
		<View style={[styles.container, open && styles.containerOpen]}>
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

					<View style={styles.review}>
						<Surface cornerRadius="control" style={styles.button} contentStyle={styles.buttonFace}>
							<XIcon size={20} color={colors.text} />
							<Copy style={styles.buttonLabel}>{t('report.detail.reviewWrong')}</Copy>
						</Surface>
						<Surface cornerRadius="control" style={styles.button} contentStyle={styles.buttonFace}>
							<CheckIcon size={20} color={colors.text} />
							<Copy style={styles.buttonLabel}>{t('report.detail.reviewCorrect')}</Copy>
						</Surface>
					</View>

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
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { paddingHorizontal: 14 },
	containerOpen: { backgroundColor: sessionDetailColors.openFace },
	panel: { paddingBottom: 18 },
	review: { flexDirection: 'row', gap: 10, marginTop: 14 },
	shares: { flexDirection: 'row', gap: 10, marginTop: 12 },
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
	shareFace: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
});

export default GuideSceneSessionPreviewItem;
