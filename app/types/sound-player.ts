export interface SoundPlayer {
	playingId: string | null;
	finishedIds: ReadonlySet<string>;
	failedId: string | null;
	progress: number;
	play: (id: string, ...urls: string[]) => void;
	toggle: (id: string, ...urls: string[]) => void;
	stop: () => void;
}
