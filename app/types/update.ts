export type UpdatePolicy = {
	latestVersion: string;
	minimumVersion: string;
	notes: string[];
};

export type PromptedUpdate = { latestVersion: string; forced: boolean; notes: string[] } | null;
