import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'react';

import type { UpdatePolicy } from '@/types/update';

import { useGetAppUpdateQuery } from '@/hooks/apis/app-update';

import { installedVersion } from '@/services/device/application';
import { getMinSupportedVersion, subscribeRemoteConfig } from '@/services/remote-config/client';
import { reportError, track } from '@/services/telemetry/client';
import { useAppStore } from '@/stores/app';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import UpdateDialog from '@/components/dialogs/update-dialog';

const VERSION_PARTS = 3;

/** 버전 문자열을 숫자 배열로 변환하는 함수 */
const versionParts = (version: string) => {
	const match = /^[vV]?(\d+(?:\.\d+){0,2})(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.exec(version.trim());

	if (!match) {
		return null;
	}

	const parts = match[1].split('.').map(Number);

	return parts.every(Number.isSafeInteger) ? [...parts, 0, 0].slice(0, VERSION_PARTS) : null;
};

/** 두 버전을 비교하는 함수 */
const compareVersions = (a: string, b: string) => {
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
};

/** 두 버전 중 높은 버전을 반환하는 함수 */
const higherVersion = (a: string, b: string) => {
	return (compareVersions(a, b) ?? 0) < 0 ? b : a;
};

/** 안내할 업데이트를 결정하는 함수 */
const evaluateUpdate = (policy: UpdatePolicy, currentVersion: string, dismissedVersion: string | null) => {
	// 최신 버전을 모르면 강제 업데이트만 판단
	const comparedToLatest = policy.latestVersion === null ? 0 : compareVersions(currentVersion, policy.latestVersion);
	const comparedToMinimum = policy.minimumVersion ? compareVersions(currentVersion, policy.minimumVersion) : 0;

	if (comparedToLatest === null || comparedToMinimum === null) {
		return null;
	}

	const forced = comparedToMinimum < 0;

	if (!forced && (comparedToLatest >= 0 || dismissedVersion === policy.latestVersion)) {
		return null;
	}

	return {
		latestVersion: policy.latestVersion,
		forced,
		notes: policy.notes,
	};
};

interface UpdatePromptContextType {
	updateVisible: boolean;
	updateCheckSettled: boolean;
}

const UpdatePromptContext = createContext<UpdatePromptContextType | undefined>(undefined);

interface Props {
	children: ReactNode;
}

/**
 * 업데이트 안내 provider
 * @param children 감싸는 내용
 */
const UpdateDialogProvider = ({ children }: Props) => {
	const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);

	const shownVersionRef = useRef<string | null | undefined>(undefined);

	const { data: appUpdateData, fetchStatus, isError, isFetching, isSuccess } = useGetAppUpdateQuery();

	const minSupportedVersion = useSyncExternalStore(subscribeRemoteConfig, getMinSupportedVersion);

	const splashFinished = useAppStore((state) => state.splashFinished);

	const updatePrompt = useDeviceSettingsStore((state) => state.updatePrompt);

	const dismissUpdate = useDeviceSettingsStore((state) => state.dismissUpdate);

	const updateCheckSettled = !isFetching && (isSuccess || isError || fetchStatus === 'paused');

	// 조회 실패 시 Remote Config로 판단
	const updatePolicy = appUpdateData
		? {
				latestVersion: appUpdateData.latest.version,
				minimumVersion: higherVersion(appUpdateData.min_supported.version, minSupportedVersion),
				notes: appUpdateData.latest.release_notes,
			}
		: { latestVersion: null, minimumVersion: minSupportedVersion, notes: [] };
	const promptedUpdate =
		appUpdateData || updateCheckSettled
			? evaluateUpdate(updatePolicy, installedVersion, updatePrompt.dismissedVersion)
			: null;
	const updateVisible =
		splashFinished &&
		!!promptedUpdate &&
		(promptedUpdate.forced || acceptedVersion !== promptedUpdate.latestVersion);

	const updatePromptState = useMemo(
		() => ({ updateVisible, updateCheckSettled }),
		[updateVisible, updateCheckSettled],
	);

	/** 업데이트 안내 표시 시 이벤트 전송 */
	useEffect(() => {
		if (updateVisible && promptedUpdate && shownVersionRef.current !== promptedUpdate.latestVersion) {
			shownVersionRef.current = promptedUpdate.latestVersion;

			track('update_prompt_shown', {
				latest_version: promptedUpdate.latestVersion,
				is_forced: promptedUpdate.forced,
			});
		}
	}, [updateVisible, promptedUpdate]);

	const handleDismissUpdate = () => {
		if (!promptedUpdate || promptedUpdate.forced || promptedUpdate.latestVersion === null) {
			return;
		}

		try {
			dismissUpdate(promptedUpdate.latestVersion);

			track('update_prompt_dismissed', { latest_version: promptedUpdate.latestVersion });
		} catch (e) {
			reportError(e, 'dismiss_update');
		}
	};

	return (
		<UpdatePromptContext.Provider value={updatePromptState}>
			{children}

			<UpdateDialog
				promptedUpdate={promptedUpdate}
				visible={updateVisible}
				onDismiss={handleDismissUpdate}
				onStoreOpened={() => setAcceptedVersion(promptedUpdate?.latestVersion ?? null)}
			/>
		</UpdatePromptContext.Provider>
	);
};

/** 업데이트 안내 표시 상태를 사용하는 Hook */
export const useUpdatePrompt = () => {
	const context = useContext(UpdatePromptContext);

	if (!context) {
		throw new Error('useUpdatePrompt must be used within an UpdateDialogProvider');
	}

	return context;
};

export default UpdateDialogProvider;
