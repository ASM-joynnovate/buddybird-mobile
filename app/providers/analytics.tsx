import { type ReactNode, useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { getParrotListOptions } from '@/hooks/apis/parrots';
import { getWordListOptions } from '@/hooks/apis/words';

import { setTelemetryUserId, syncUserProperties } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';

interface Props {
	children: ReactNode;
}

/**
 * 분석 사용자 ID와 사용자 속성 설정 provider
 * @param children 감싸는 내용
 */
const AnalyticsProvider = ({ children }: Props) => {
	const { data: parrotListData } = useQuery({ ...getParrotListOptions(), throwOnError: false });
	const { data: wordListData } = useQuery({ ...getWordListOptions(), throwOnError: false });

	const serverUserId = useAccountStore((state) => state.serverUserId);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const parrot = parrotListData?.[0] ?? null;
	const wordCount = wordListData?.length;

	/** 서버 사용자 ID로 분석 사용자 ID 설정 */
	useEffect(() => {
		setTelemetryUserId(serverUserId);
	}, [serverUserId]);

	/** 앵무새, 단어 수, 앱 언어 변경 시 사용자 속성 동기화 */
	useEffect(() => {
		if (wordCount !== undefined) {
			syncUserProperties(parrot, wordCount);
		}
	}, [parrot, wordCount, locale]);

	return <>{children}</>;
};

export default AnalyticsProvider;
