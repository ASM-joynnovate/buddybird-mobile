import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import Animated, { type AnimatedRef } from 'react-native-reanimated';

import SoundKindIcon from '@/screens/report/components/sound-kind-icon';
import { colors, font } from '@/theme';
import type { SoundKind } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

interface Props {
	kind: SoundKind;
	labelRef?: AnimatedRef<Animated.View>;
	nameRef?: AnimatedRef<Animated.View>;
}

/**
 * 선택한 소리의 종류 라벨 컴포넌트
 * @param kind 소리 종류
 * @param labelRef 라벨 위치를 잴 ref
 * @param nameRef 종류 이름 위치를 잴 ref
 */
const RecorderKindLabel = ({ kind, labelRef, nameRef }: Props) => {
	const { t } = useTranslation();

	return (
		<Animated.View ref={labelRef} style={styles.label}>
			<SoundKindIcon kind={kind} size="small" />

			<Animated.View ref={nameRef}>
				<Copy numberOfLines={1} style={styles.name}>
					{t(`report.detail.kinds.${kind}`)}
				</Copy>
			</Animated.View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	label: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingTop: 5,
		paddingRight: 10,
		paddingBottom: 5,
		paddingLeft: 6,
		borderRadius: 10,
		backgroundColor: colors.background,
	},
	name: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 15, color: colors.muted },
});

export default RecorderKindLabel;
