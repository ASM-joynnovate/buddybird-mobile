import { type ReactNode, useCallback, useEffect } from 'react';

import { AppState } from 'react-native';

import { useSendAdEvents } from '@/hooks/apis/ads';

import { AD_EVENT_FLUSH_AT, AD_EVENT_MAX_BATCH_SIZE } from '@/config/policy';
import { useAdStore } from '@/stores/ad';

interface Props {
	children: ReactNode;
}

/**
 * 광고 이벤트 전송 provider
 * @param children 감싸는 내용
 */
const AdEventsProvider = ({ children }: Props) => {
	const { mutate: sendAdEvents } = useSendAdEvents();

	const adEventCount = useAdStore((state) => state.adEvents.length);

	const removeAdEvents = useAdStore((state) => state.removeAdEvents);

	/** 쌓인 광고 이벤트 전송 함수 */
	const sendAdEventBatch = useCallback(() => {
		const adEventBatch = useAdStore.getState().adEvents.slice(0, AD_EVENT_MAX_BATCH_SIZE);

		if (adEventBatch.length === 0) {
			return;
		}

		sendAdEvents({ data: { events: adEventBatch } }, { onSuccess: () => removeAdEvents(adEventBatch) });
	}, [sendAdEvents, removeAdEvents]);

	/** 이벤트가 일정 개수 쌓이면 전송 */
	useEffect(() => {
		if (adEventCount >= AD_EVENT_FLUSH_AT) {
			sendAdEventBatch();
		}
	}, [adEventCount, sendAdEventBatch]);

	/** background 전환 시 전송 */
	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', (appState) => {
			if (appState === 'background') {
				sendAdEventBatch();
			}
		});

		return () => appStateSubscription.remove();
	}, [sendAdEventBatch]);

	return <>{children}</>;
};

export default AdEventsProvider;
