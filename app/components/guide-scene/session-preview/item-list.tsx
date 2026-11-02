import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { formatHour } from '@/i18n/format';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import { Copy } from '@/components/ui/copy';

interface Props {
	hour: string;
	children: ReactNode;
}

/**
 * 학습 상세 예시의 시간별 기록 목록 컴포넌트
 * @param hour 기록 시각
 * @param children 기록 행
 */
const GuideSceneSessionPreviewItemList = ({ hour, children }: Props) => {
	const locale = useDeviceSettingsStore((state) => state.locale);

	return (
		<View>
			<Copy style={styles.hour}>{formatHour(hour, locale)}</Copy>
			<View style={styles.itemList}>{children}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	hour: {
		marginTop: 8,
		marginBottom: 8,
		fontFamily: font.semiBold,
		fontSize: 16,
		lineHeight: 22,
		fontVariant: ['tabular-nums'],
	},
	itemList: { overflow: 'hidden', borderRadius: 16, backgroundColor: sessionDetailColors.face },
});

export default GuideSceneSessionPreviewItemList;
