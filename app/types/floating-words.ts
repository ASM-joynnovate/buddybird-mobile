export interface FloatingWordStill {
	x: number;
	rise: number;
}

export interface FloatingWordPath {
	start: number;
	end: number;
	tilt: number;
	still: FloatingWordStill | null;
}
