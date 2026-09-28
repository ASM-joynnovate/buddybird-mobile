import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getAppUpdateOptions } from '@/hooks/apis/app-update';
import { getParrotListOptions } from '@/hooks/apis/parrots';
import { getRunningSessionOptions } from '@/hooks/apis/sessions';

import { installedVersion } from '@/services/device/application';
import { reportError, track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useFeedbackStore } from '@/stores/feedback';
import { feedbackThreshold } from '@/utils/feedback';
import { evaluateUpdate } from '@/utils/update';

import FeedbackDialog from '@/components/dialogs/feedback-dialog';
import UpdateDialog from '@/components/dialogs/update-dialog';

interface Props {
	children: ReactNode;
	splashFinished: boolean;
}

/**
 * 업데이트 안내와 의견 요청 다이얼로그 provider
 * @param children 감싸는 내용
 * @param splashFinished 스플래시 종료 여부
 */
const StartupDialogProvider = ({ children, splashFinished }: Props) => {
	const [promptOpen, setPromptOpen] = useState(false);
	const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);

	const shownVersionRef = useRef<string | null>(null);
	const feedbackPromptOpenRef = useRef(false);

	const {
		data: appUpdateData,
		fetchStatus,
		isError,
		isFetching,
		isSuccess,
	} = useQuery({ ...getAppUpdateOptions(), throwOnError: false });
	const { data: parrotListData } = useQuery({ ...getParrotListOptions(), throwOnError: false });
	const { data: runningSessionData } = useQuery({ ...getRunningSessionOptions(), throwOnError: false });

	const updatePrompt = useDeviceSettingsStore((state) => state.updatePrompt);
	const feedbackPrompt = useDeviceSettingsStore((state) => state.feedbackPrompt);
	const dismissUpdate = useDeviceSettingsStore((state) => state.dismissUpdate);
	const consumeFeedbackPrompt = useDeviceSettingsStore((state) => state.consumeFeedbackPrompt);

	const openedFrom = useFeedbackStore((state) => state.openedFrom);
	const openFeedback = useFeedbackStore((state) => state.openFeedback);

	const promptedUpdate = appUpdateData
		? evaluateUpdate(
				{
					latestVersion: appUpdateData.latest_version,
					minimumVersion: appUpdateData.min_supported_version,
					notes: appUpdateData.release_notes,
				},
				installedVersion,
				updatePrompt.dismissedVersion,
			)
		: null;
	const updateVisible =
		splashFinished &&
		!!promptedUpdate &&
		(promptedUpdate.forced || acceptedVersion !== promptedUpdate.latestVersion);
	const updateCheckSettled = !isFetching && (isSuccess || isError || fetchStatus === 'paused');

	const sessionActive = runningSessionData != null;
	const threshold = feedbackThreshold(feedbackPrompt);
	const eligible =
		splashFinished &&
		(parrotListData?.length ?? 0) > 0 &&
		updateCheckSettled &&
		!updateVisible &&
		!sessionActive &&
		!openedFrom &&
		feedbackPrompt.dayCount >= threshold;

	/** 업데이트 안내가 보일 때 버전마다 한 번 표시 이벤트 전송 */
	useEffect(() => {
		if (updateVisible && promptedUpdate && shownVersionRef.current !== promptedUpdate.latestVersion) {
			shownVersionRef.current = promptedUpdate.latestVersion;

			track('update_prompt_shown', {
				latest_version: promptedUpdate.latestVersion,
				is_forced: promptedUpdate.forced,
			});
		}
	}, [updateVisible, promptedUpdate]);

	/** 의견 요청 조건 충족 시 의견 요청 한 번 표시 */
	useEffect(() => {
		if (!eligible || feedbackPromptOpenRef.current) {
			return;
		}

		feedbackPromptOpenRef.current = true;
		setPromptOpen(true);

		track('feedback_prompt_shown', { threshold });
	}, [eligible, threshold]);

	/** 업데이트 안내 닫기와 닫은 버전 저장 */
	const handleDismissUpdate = () => {
		if (!promptedUpdate || promptedUpdate.forced) {
			return;
		}

		try {
			dismissUpdate(promptedUpdate.latestVersion);

			track('update_prompt_dismissed', { latest_version: promptedUpdate.latestVersion });
		} catch (e) {
			reportError(e, 'dismiss_update');
		}
	};

	/** 의견 요청 답 저장과 의견 다이얼로그 열기 */
	const answerFeedbackPrompt = (wantsToWrite: boolean) => {
		if (!feedbackPromptOpenRef.current) {
			return;
		}

		feedbackPromptOpenRef.current = false;

		try {
			consumeFeedbackPrompt();

			if (wantsToWrite) {
				openFeedback('prompt');
			} else {
				track('feedback_prompt_dismissed', { threshold });
			}
		} catch (e) {
			reportError(e, 'feedback_prompt');
		} finally {
			setPromptOpen(false);
		}
	};

	return (
		<>
			{children}

			{/*새 버전 안내와 업데이트 버튼*/}
			<UpdateDialog
				promptedUpdate={promptedUpdate}
				visible={updateVisible}
				onDismiss={handleDismissUpdate}
				onStoreOpened={() => setAcceptedVersion(promptedUpdate?.latestVersion ?? null)}
			/>

			{/*의견을 쓸지 묻는 안내와 의견 입력*/}
			<FeedbackDialog
				visible={(openedFrom !== null || promptOpen) && !updateVisible}
				prompt={
					promptOpen
						? { onDismiss: () => answerFeedbackPrompt(false), onWrite: () => answerFeedbackPrompt(true) }
						: undefined
				}
			/>
		</>
	);
};

export default StartupDialogProvider;
