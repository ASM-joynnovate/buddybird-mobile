export interface ReportTarget {
	feedItemId: string;
	userId: string;
}

export interface BlockTarget {
	userId: string;
	nickname: string | null;
}

export interface PopoverAnchor {
	x: number;
	y: number;
	width: number;
	height: number;
}
