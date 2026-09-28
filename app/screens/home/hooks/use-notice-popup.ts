import { useEffect, useState } from 'react';

import type { Notice } from '@/types/apis/notices';

import { useReadNotice } from '@/hooks/apis/notices';

import { launch } from '@/screens/home/hooks/launch';

export function useNoticePopup(notices: readonly Notice[] | undefined): {
	current: Notice | null;
	close(): void;
} {
	const [queue, setQueue] = useState<readonly Notice[]>([]);

	const { mutate } = useReadNotice();

	const current = queue[0] ?? null;

	useEffect(() => {
		if (!notices || launch.noticesShown) {
			return;
		}

		launch.noticesShown = true;

		setQueue(notices);
	}, [notices]);

	return {
		current,
		close: () => {
			if (current) {
				mutate({ id: current.id });

				setQueue((items) => items.slice(1));
			}
		},
	};
}
