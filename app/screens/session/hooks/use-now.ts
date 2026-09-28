import { useEffect, useState } from 'react';

import { SECOND } from '@/utils/units';

export function useNow(enabled = true, intervalMs = SECOND): number {
	const [now, setNow] = useState(Date.now);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		setNow(Date.now());

		const timer = setInterval(() => setNow(Date.now()), intervalMs);

		return () => clearInterval(timer);
	}, [enabled, intervalMs]);

	return now;
}
