import { Easing } from 'react-native-reanimated';

export { colors, loginProviderColors } from '@/theme/colors';

export const radius = {
	none: 0,
	xsmall: 4,
	small: 8,
	toggle: 12,
	tile: 14,
	card: 18,
	control: 16,
	illustration: 20,
	sheet: 28,
	pill: 999,
};

export const depths = {
	none: 0,
	low: 2,
	medium: 4,
	high: 6,
	xhigh: 8,
};

export const contentMaxWidth = 480;

export const layoutAnimationMs = 200;

export const burstEasing = Easing.bezier(0.16, 1, 0.3, 1);

export const font = {
	medium: 'Pretendard-Medium',
	semiBold: 'Pretendard-SemiBold',
	bold: 'Pretendard-Bold',
	extraBold: 'Pretendard-ExtraBold',
	black: 'Pretendard-Black',
	splash: 'Fredoka-SemiBold',
};

export const appIconImage = require('@assets/images/icon.png');
