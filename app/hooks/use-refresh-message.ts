import { useEffect, useState } from 'react';

import type { PullStatus } from '@/types/pull-to-refresh';

import { useTranslation } from 'react-i18next';

import { useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const MESSAGE_SHOW_DELAY_MS = 120;
const MESSAGE_SHOW_MS = 240;
const MESSAGE_HIDE_MS = 180;

let lastMessageIndex = -1;

/**
 * 새로고침 문구 Hook
 * @param status 당기기 상태
 */
const useRefreshMessage = (status: PullStatus) => {
	const { t } = useTranslation();

	const motionReduced = useReducedMotion();

	const [message, setMessage] = useState('');

	const messageProgress = useSharedValue(0);

	/** 이전 문구를 제외하고 무작위 선택 */
	useEffect(() => {
		if (status !== 'refreshing') {
			return;
		}

		const messages = t('common.pullToRefresh.messages', { returnObjects: true });
		const candidates = messages.map((_, index) => index).filter((index) => index !== lastMessageIndex);

		lastMessageIndex = candidates[Math.floor(Math.random() * candidates.length)];
		setMessage(messages[lastMessageIndex]);
	}, [status, t]);

	/** 새로고침하는 동안 문구 표시 */
	useEffect(() => {
		const pullRefreshing = status === 'refreshing';

		if (motionReduced) {
			messageProgress.set(pullRefreshing ? 1 : 0);

			return;
		}

		messageProgress.set(
			pullRefreshing
				? withDelay(MESSAGE_SHOW_DELAY_MS, withTiming(1, { duration: MESSAGE_SHOW_MS }))
				: withTiming(0, { duration: MESSAGE_HIDE_MS }),
		);
	}, [messageProgress, motionReduced, status]);

	return { message, messageProgress };
};

export default useRefreshMessage;
