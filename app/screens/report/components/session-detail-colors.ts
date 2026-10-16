import { colors } from '@/theme';
import type { LogItemKind } from '@/utils/session-log';

export const sessionDetailColors = {
	face: '#f3f4f6',
	openFace: '#eaecef',
	divider: '#e3e5e8',
	track: '#dcdfe3',
	media: '#262626',
};

interface LogItemColor {
	accent: string;
	tagFace: string;
	tagText: string;
}

export const logItemColors: Record<LogItemKind, LogItemColor> = {
	parrot: { accent: colors.text, tagFace: sessionDetailColors.track, tagText: colors.text },
	mimic: { accent: colors.orange, tagFace: colors.orange, tagText: colors.onFilled },
	emergency: { accent: colors.error, tagFace: colors.error, tagText: colors.onFilled },
	parrotDisappeared: { accent: colors.error, tagFace: colors.error, tagText: colors.onFilled },
	parrotAppeared: { accent: colors.text, tagFace: colors.text, tagText: colors.onFilled },
};
