import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { MicIcon } from 'lucide-react-native';
import type { SharedValue } from 'react-native-reanimated';

import TalkButtonSoundBar from '@/screens/session/components/talk-button/sound-bar';
import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const ICON_SIZE = 20;
const BUTTON_HEIGHT = 56;
const LEVEL_THRESHOLDS = [0.02, 0.05, 0.1, 0.2];

interface Props {
	talking: boolean;
	audioLevel: SharedValue<number>;
	onTalkStart: () => void;
	onTalkEnd: () => void;
}

/**
 * 누르고 있는 동안 말하는 버튼 컴포넌트
 * @param talking 말하는 중 여부
 * @param audioLevel 보내는 마이크 소리 크기
 * @param onTalkStart 누르기 시작할 때 실행할 함수
 * @param onTalkEnd 손을 뗄 때 실행할 함수
 */
const TalkButton = ({ talking, audioLevel, onTalkStart, onTalkEnd }: Props) => {
	const { t } = useTranslation();

	return (
		<PressableSurface
			depth="medium"
			cornerRadius="pill"
			edgeColor={talking ? sessionColors.cameraOnEdge : sessionColors.edge}
			faceColor={sessionColors.background}
			contentStyle={styles.face}
			accessibilityLabel={t('session.watch.talk')}
			accessibilityState={{ selected: talking }}
			onPressIn={onTalkStart}
			onPressOut={onTalkEnd}
		>
			<MicIcon size={ICON_SIZE} color={talking ? sessionColors.cameraOn : sessionColors.text} />
			<Copy style={[styles.label, talking && styles.talkingLabel]}>
				{t(talking ? 'session.watch.talking' : 'session.watch.talk')}
			</Copy>
			{talking && (
				<View style={styles.bars} pointerEvents="none">
					{LEVEL_THRESHOLDS.map((threshold) => (
						<TalkButtonSoundBar key={threshold} audioLevel={audioLevel} threshold={threshold} />
					))}
				</View>
			)}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	face: {
		height: BUTTON_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		paddingHorizontal: 22,
	},
	label: { fontFamily: font.extraBold, fontSize: 16, color: sessionColors.text },
	talkingLabel: { color: sessionColors.cameraOn },
	bars: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 },
});

export default TalkButton;
