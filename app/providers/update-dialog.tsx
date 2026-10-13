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

import { useQuery } from '@tanstack/react-query';

import { getAppUpdateOptions } from '@/hooks/apis/app-update';

import { installedVersion } from '@/services/device/application';
import { getMinSupportedVersion, subscribeRemoteConfig } from '@/services/remote-config/client';
import { reportError, track } from '@/services/telemetry/client';
import { useAppStore } from '@/stores/app';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { evaluateUpdate, higherVersion } from '@/utils/update';

import UpdateDialog from '@/components/dialogs/update-dialog';

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

	const {
		data: appUpdateData,
		fetchStatus,
		isError,
		isFetching,
		isSuccess,
	} = useQuery({ ...getAppUpdateOptions(), throwOnError: false });

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
