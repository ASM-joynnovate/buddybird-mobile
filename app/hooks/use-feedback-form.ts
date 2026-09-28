import { useState } from 'react';

import { feedbackMutationOptions } from '@/hooks/apis/feedback';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

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
	const mutation = useIdempotentMutation(feedbackMutationOptions());

	const [message, setMessage] = useState('');

	function close() {
		if (mutation.isPending) {
			return;
		}

		mutation.reset();

		setMessage('');

		onClose();
	}

	function submit() {
		if (mutation.isPending || !message.trim()) {
			return;
		}

		mutation.mutate(
			{ input: { message: message.trim() } },
			{
				onSuccess: () => {
					track('feedback_submitted', { source, message_length: message.trim().length });

					setMessage('');
				},
			},
		);
	}

	return {
		message,
		setMessage,
		busy: mutation.isPending,
		sent: mutation.isSuccess,
		sendFailed: mutation.isError,
		close,
		submit,
	};
}
