import type { AppData } from "@/types/app-data"

export type MigrationStep = (key: string, apply: () => void) => void

export function migrationSteps(data: AppData) {
	const completed = new Set(data.migration.completed)

	data.migration.issues = []

	const step: MigrationStep = (key, apply) => {
		if (completed.has(key)) {
			return
		}

		try {
			apply()
			completed.add(key)
			data.migration.completed.push(key)
		} catch (error) {
			data.migration.issues.push({
				key,
				message: error instanceof Error ? error.message : String(error),
			})
		}
	}

	return step
}

export function migrationGroup(data: AppData, key: string, apply: () => void) {
	try {
		apply()
	} catch (error) {
		data.migration.issues.push({
			key,
			message: error instanceof Error ? error.message : String(error),
		})
	}
}
