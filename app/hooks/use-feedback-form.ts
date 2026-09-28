import { useState } from 'react';

import { ApiError } from '@/types/apis/common';

import { useSendFeedback } from '@/hooks/apis/feedback';

import { randomUUID } from 'expo-crypto';

import { track } from '@/services/telemetry/client';

export interface FeedbackForm {
	message: string;
	setMessage(message: string): void;
	busy: boolean;
	sent: boolean;
	sendFailed: boolean;
	close(): void;
	submit(): void;
}

export function useFeedbackForm(source: 'profile' | 'prompt', onClose: () => void): FeedbackForm {
	const [message, setMessage] = useState('');
	const [idempotencyKey, setIdempotencyKey] = useState(() => randomUUID());

	const { isError, isPending, isSuccess, mutate, reset } = useSendFeedback();

	function close() {
		if (isPending) {
			return;
		}

		reset();

		setMessage('');
		setIdempotencyKey(randomUUID());

		onClose();
	}

	function submit() {
		if (isPending || !message.trim()) {
			return;
		}

		mutate(
			{ data: { message: message.trim() }, idempotencyKey },
			{
				onSuccess: () => {
					track('feedback_submitted', { source, message_length: message.trim().length });

					setMessage('');
					setIdempotencyKey(randomUUID());
				},
				onError: (error) => {
					if (error instanceof ApiError && error.rejected) {
						setIdempotencyKey(randomUUID());
					}
				},
			},
		);
	}

	return {
		message,
		setMessage,
		busy: isPending,
		sent: isSuccess,
		sendFailed: isError,
		close,
		submit,
	};
}
