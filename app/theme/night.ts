import { colors, phaseColors } from "@/theme/colors"

export function shade(hex: string, factor: number): string {
	const value = Number.parseInt(hex.slice(1, 7), 16)
	const channel = (shift: number) =>
		Math.round(((value >> shift) & 255) * factor)
			.toString(16)
			.padStart(2, "0")

	return `#${channel(16)}${channel(8)}${channel(0)}`
}

export const night = {
	background: shade(colors.text, 0),
	surface: shade(colors.text, 0.3),
	text: shade(colors.muted, 0.98),
	faint: shade(colors.muted, 0.76),
	track: shade(colors.border, 0.16),
	edge: shade(colors.border, 0.24),
	warn: shade(colors.error, 0.64),
}

export function nightPhaseColor(phase: keyof typeof phaseColors): string {
	return shade(phaseColors[phase], 0.4)
}
