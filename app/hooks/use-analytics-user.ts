import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getParrotListOptions } from '@/hooks/apis/parrots';
import { getWordListOptions } from '@/hooks/apis/words';

import { setTelemetryIdentity, syncUserProperties } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

export function useAnalyticsUser(): void {
	const { data: parrotListData } = useQuery({ ...getParrotListOptions(), throwOnError: false });
	const { data: wordListData } = useQuery({ ...getWordListOptions(), throwOnError: false });

	const serverUserId = useAccountStore((account) => account.serverUserId);
	const locale = useDeviceSettingsStore((state) => state.locale);

	const parrot = parrotListData?.[0] ?? null;
	const wordCount = wordListData?.length;

	useEffect(() => setTelemetryIdentity(serverUserId), [serverUserId]);

	useEffect(() => {
		if (wordCount !== undefined) {
			syncUserProperties(parrot, wordCount);
		}
	}, [parrot, wordCount, locale]);
}
