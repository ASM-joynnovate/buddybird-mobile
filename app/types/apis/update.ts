import type  { Locale } from "@/types/locale"

export type UpdatePolicy = {
	latestVersion: string
	minimumVersion: string
	notes: Partial<Record<Locale, string[]>>
}

export type UpdateDecision = { latestVersion: string; forced: boolean; notes: string[] } | null
