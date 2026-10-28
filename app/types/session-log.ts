export type LogItemKind = 'parrot' | 'mimic' | 'distressCall' | 'parrotDisappeared' | 'parrotAppeared';

export type LogFilter = 'all' | 'sound' | 'word' | 'emergency';

export interface StickyLayout {
	y: number;
	height: number;
}
