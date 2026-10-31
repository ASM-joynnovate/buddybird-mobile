import { useEffect } from 'react';

import type { HotUpdaterFallbackComponentProps } from '@hot-updater/react-native';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import AppSplash from '@/components/app/app-splash';

/**
 * 긴급 업데이트 다운로드 중 표시하는 컴포넌트
 * @param status 업데이트 확인 및 다운로드 상태
 * @param progress 0에서 1 사이의 다운로드 진행률
 */
const AppUpdateFallback = ({ status, progress }: HotUpdaterFallbackComponentProps) => {
	const setSplashShown = useDeviceSettingsStore((state) => state.setSplashShown);

	/** 다운로드 시작 시 스플래시 표시 기록 */
	useEffect(() => {
		if (status === 'UPDATING') {
			setSplashShown(true);
		}
	}, [setSplashShown, status]);

	// 확인 중에는 네이티브 스플래시 유지
	if (status !== 'UPDATING') {
		return null;
	}

	return <AppSplash downloadProgress={progress} />;
};

export default AppUpdateFallback;
