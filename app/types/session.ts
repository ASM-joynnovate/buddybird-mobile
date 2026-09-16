import type { SourceType, WordSnapshot } from "@/types/word"

export type SessionSettings = {
	wordId: string
	sourceType: SourceType
	libraryEntryId?: string
	totalDurationSeconds: number
	learningDurationSeconds: number
	restDurationSeconds: number
	stressCareDurationSeconds: number
}

export type History = SessionSettings & {
	id: string
	completedCycles: number
	totalLearningSeconds: number
	startedAt: string
	endedAt?: string
	word: WordSnapshot
}

export type SessionDraft = {
	metricsCredited?: boolean
	captureCount?: number
	id: string
	settings: SessionSettings
	word: WordSnapshot
	startedAt: string
	clientWordId: string
	parrotSpecies: string | null
	parrotBirthdate: string | null
}

export type Timing = Omit<SessionSettings, "wordId" | "sourceType" | "libraryEntryId">
