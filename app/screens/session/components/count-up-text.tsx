import { useState } from 'react';

import { type StyleProp, StyleSheet, type TextStyle, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { type SharedValue, useAnimatedReaction, useReducedMotion } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import { Copy } from '@/components/ui/copy';

const COUNT_STEPS = 24;

export type CountUnit = 'count' | 'duration';

interface Props {
	progress: SharedValue<number>;
	from: number;
	to: number;
	unit: CountUnit;
	style?: StyleProp<TextStyle>;
}

/**
 * 진행률에 따라 올라가는 숫자 컴포넌트
 * @param progress 0에서 1까지의 진행률
 * @param from 시작 값
 * @param to 끝 값
 * @param unit 횟수 또는 밀리초 시간
 * @param style 글자 스타일
 */
const CountUpText = ({ progress, from, to, unit, style }: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const [shownValue, setShownValue] = useState(reducedMotion ? to : from);

	const locale = useDeviceSettingsStore((state) => state.locale);

	/** 값을 표시할 글자로 변환하는 함수 */
	const toText = (value: number) => {
		return unit === 'count' ? t('session.summary.count', { count: value }) : formatDuration(value, locale);
	};

	/** 진행률이 다음 단계로 넘어가면 보이는 값 변경 */
	useAnimatedReaction(
		() => Math.round(progress.get() * COUNT_STEPS),
		(step, previous) => {
			if (step !== previous) {
				scheduleOnRN(setShownValue, Math.round(from + ((to - from) * step) / COUNT_STEPS));
			}
		},
	);

	return (
		<View>
			<Copy
				style={[style, styles.hidden]}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				{toText(to)}
			</Copy>

			<Copy style={[styles.shown, style]} accessibilityLabel={toText(to)}>
				{toText(shownValue)}
			</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	hidden: { opacity: 0 },
	shown: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});

export default CountUpText;
