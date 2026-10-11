import { colors } from '@/theme';
import type { SoundKind } from '@/utils/tape-log';

interface SoundKindColor {
	face: string;
	edge: string;
	line: string;
	lane: string;
	text: string;
}

export const soundKindColors: Record<SoundKind, SoundKindColor> = {
	parrot: {
		face: colors.blue,
		edge: colors.blueDark,
		line: colors.blueSoft,
		lane: colors.blueLight,
		text: colors.text,
	},
	mimic: {
		face: colors.purple,
		edge: colors.purpleDark,
		line: colors.purpleSoft,
		lane: colors.purpleLight,
		text: colors.purpleDark,
	},
	emergency: {
		face: colors.error,
		edge: colors.errorDark,
		line: colors.errorSoft,
		lane: colors.errorPale,
		text: colors.errorDark,
	},
};
