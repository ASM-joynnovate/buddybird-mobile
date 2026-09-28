import type { PromptedUpdate, UpdatePolicy } from '@/types/update';

const VERSION_PARTS = 3;

function versionParts(version: string): number[] | null {
	const match = /^[vV]?(\d+(?:\.\d+){0,2})(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.exec(version.trim());

	if (!match) {
		return null;
	}

	const parts = match[1].split('.').map(Number);

	return parts.every(Number.isSafeInteger) ? [...parts, 0, 0].slice(0, VERSION_PARTS) : null;
}

function compareVersions(a: string, b: string): number | null {
	const left = versionParts(a);
	const right = versionParts(b);

	if (!left || !right) {
		return null;
	}

	for (let i = 0; i < VERSION_PARTS; i++) {
		if (left[i] !== right[i]) {
			return Math.sign(left[i] - right[i]);
		}
	}

	return 0;
}

export function evaluateUpdate(
	policy: UpdatePolicy,
	installedVersion: string,
	dismissedVersion: string | null,
): PromptedUpdate {
	if (!policy.latestVersion || compareVersions(installedVersion, policy.latestVersion) === null) {
		return null;
	}

	const comparedToMinimum = policy.minimumVersion ? compareVersions(installedVersion, policy.minimumVersion) : 0;

	if (comparedToMinimum === null) {
		return null;
	}

	const forced = comparedToMinimum < 0;

	if (
		!forced &&
		((compareVersions(installedVersion, policy.latestVersion) ?? 0) >= 0 ||
			dismissedVersion === policy.latestVersion)
	) {
		return null;
	}

	return {
		latestVersion: policy.latestVersion,
		forced,
		notes: policy.notes,
	};
}
