import { useEffect, useState } from 'react';

import type { Notice } from '@/types/apis/notices';

import { useReadNotice } from '@/hooks/apis/notices';

import { useNoticeStore } from '@/stores/notice';

export function useNoticePopup(notices: readonly Notice[] | undefined): {
	current: Notice | null;
	close(): void;
} {
	const [queue, setQueue] = useState<readonly Notice[]>([]);

	const { mutate } = useReadNotice();

	const popupShown = useNoticeStore((state) => state.popupShown);
	const setPopupShown = useNoticeStore((state) => state.setPopupShown);

	const current = queue[0] ?? null;

	useEffect(() => {
		if (!notices || popupShown) {
			return;
		}

		setPopupShown(true);

		setQueue(notices);
	}, [notices, popupShown, setPopupShown]);

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
