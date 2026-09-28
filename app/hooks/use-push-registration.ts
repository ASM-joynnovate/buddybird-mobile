import { useEffect } from 'react';

import { startPush } from '@/services/push/lifecycle';

export function usePushRegistration(registered: boolean): void {
	useEffect(() => {
		if (!registered) {
			return;
		}

		return startPush();
	}, [registered]);
}
