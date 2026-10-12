import { colors } from '@/theme';
import type { SoundKind } from '@/utils/tape-log';

interface SoundKindColor {
	face: string;
	text: string;
	subText: string;
	scoreTrack: string;
	scoreFill: string;
	playFace: string;
	playIcon: string;
	badge: string;
}

export const soundKindColors: Record<SoundKind, SoundKindColor> = {
	parrot: {
		face: colors.grayPale,
		text: colors.text,
		subText: colors.muted,
		scoreTrack: colors.blackFaint,
		scoreFill: colors.text,
		playFace: colors.text,
		playIcon: colors.onFilled,
		badge: colors.text,
	},
	mimic: {
		face: colors.orange,
		text: colors.onFilled,
		subText: colors.onFilled,
		scoreTrack: colors.whiteSoft,
		scoreFill: colors.onFilled,
		playFace: colors.onFilled,
		playIcon: colors.orangeDark,
		badge: colors.orange,
	},
	emergency: {
		face: colors.error,
		text: colors.onFilled,
		subText: colors.onFilled,
		scoreTrack: colors.whiteSoft,
		scoreFill: colors.onFilled,
		playFace: colors.onFilled,
		playIcon: colors.errorDark,
		badge: colors.error,
	},
};
