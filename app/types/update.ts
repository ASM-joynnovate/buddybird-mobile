export interface UpdatePolicy {
	latestVersion: string | null;
	minimumVersion: string;
	notes: string[];
}

export type PromptedUpdate = { latestVersion: string | null; forced: boolean; notes: string[] } | null;
