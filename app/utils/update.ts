import type { UpdatePolicy } from '@/types/update';

const VERSION_PARTS = 3;

/** 버전 문자열을 숫자 배열로 변환하는 함수 */
const _versionParts = (version: string) => {
	const match = /^[vV]?(\d+(?:\.\d+){0,2})(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.exec(version.trim());

	if (!match) {
		return null;
	}

	const parts = match[1].split('.').map(Number);

	return parts.every(Number.isSafeInteger) ? [...parts, 0, 0].slice(0, VERSION_PARTS) : null;
};

/** 두 버전을 비교하는 함수 */
const _compareVersions = (a: string, b: string) => {
	const left = _versionParts(a);
	const right = _versionParts(b);

	if (!left || !right) {
		return null;
	}

	for (let i = 0; i < VERSION_PARTS; i++) {
		if (left[i] !== right[i]) {
			return Math.sign(left[i] - right[i]);
		}
	}

	return 0;
};

/** 안내할 업데이트를 결정하는 함수 */
export const evaluateUpdate = (policy: UpdatePolicy, installedVersion: string, dismissedVersion: string | null) => {
	if (!policy.latestVersion || _compareVersions(installedVersion, policy.latestVersion) === null) {
		return null;
	}

	const comparedToMinimum = policy.minimumVersion ? _compareVersions(installedVersion, policy.minimumVersion) : 0;

	if (comparedToMinimum === null) {
		return null;
	}

	const forced = comparedToMinimum < 0;

	if (
		!forced &&
		((_compareVersions(installedVersion, policy.latestVersion) ?? 0) >= 0 ||
			dismissedVersion === policy.latestVersion)
	) {
		return null;
	}

	return {
		latestVersion: policy.latestVersion,
		forced,
		notes: policy.notes,
	};
};
