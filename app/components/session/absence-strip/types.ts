import type { SleepWindow } from "@/services/session/phases"

export interface StripData {
	running: boolean
	sleep: SleepWindow
	activity: readonly { at: number; level: number }[]
	sounds: readonly { id: string; at: number; mimicked: boolean }[]
	cursor?: number | null
	onSelectSound?(id: string): void
	onSelectTime?(at: number): void
}
