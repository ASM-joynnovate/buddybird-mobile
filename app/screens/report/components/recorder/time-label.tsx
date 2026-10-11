import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import Animated, { type AnimatedRef } from 'react-native-reanimated';

import { colors, font } from '@/theme';
import type { TapeItem } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

interface Props {
	item: TapeItem | null;
	labelRef?: AnimatedRef<Animated.View>;
	timeRef?: AnimatedRef<Animated.View>;
	recordingRef?: AnimatedRef<Animated.View>;
}

/**
 * 선택한 소리의 시각 라벨 컴포넌트
 * @param item 선택한 알약, 없으면 내 목소리
 * @param labelRef 라벨 위치를 잴 ref
 * @param timeRef 시각 글자 위치를 잴 ref
 * @param recordingRef 녹음 이름 위치를 잴 ref
 */
const RecorderTimeLabel = ({ item, labelRef, timeRef, recordingRef }: Props) => {
	const { t } = useTranslation();

	return (
		<Animated.View ref={labelRef} style={styles.label}>
			<Animated.View ref={timeRef}>
				<Copy style={styles.time}>
					{item ? dayjs(item.startedAt).format('LT') : t('report.detail.myVoice')}
				</Copy>
			</Animated.View>

			{!item && (
				<Animated.View ref={recordingRef}>
					<Copy style={styles.recording}>{t('report.detail.firstRecording')}</Copy>
				</Animated.View>
			)}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	label: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 10,
		backgroundColor: colors.background,
	},
	time: { fontFamily: font.black, fontSize: 15, lineHeight: 18, fontVariant: ['tabular-nums'] },
	recording: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 15, color: colors.muted },
});

export default RecorderTimeLabel;
