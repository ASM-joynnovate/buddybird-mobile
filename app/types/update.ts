export type UpdatePolicy = {
	latestVersion: string
	minimumVersion: string
	notes: string[]
}

export type UpdateDecision = { latestVersion: string; forced: boolean; notes: string[] } | null
