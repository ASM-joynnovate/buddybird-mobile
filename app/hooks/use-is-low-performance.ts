import { useEffect, useState } from 'react';

import { Platform } from 'react-native';

import { useLowPowerMode } from 'expo-battery';
import * as Device from 'expo-device';

import { LOW_PERFORMANCE_MEMORY_BYTES } from '@/config/policy';
import { reportError } from '@/services/telemetry/client';

const LOW_RAM_FEATURE = 'android.hardware.ram.low';

const lowMemoryDevice = Device.totalMemory !== null && Device.totalMemory < LOW_PERFORMANCE_MEMORY_BYTES;

let lowRamFeatureCheck: Promise<boolean> | null = null;

/** Android 저메모리 기기 표시를 한 번만 조회하는 함수 */
const checkLowRamFeature = () => {
	lowRamFeatureCheck ??=
		Platform.OS === 'android'
			? Device.hasPlatformFeatureAsync(LOW_RAM_FEATURE).catch((error: unknown) => {
					reportError(error, 'low_ram_feature');

					return false;
				})
			: Promise.resolve(false);

	return lowRamFeatureCheck;
};

/** 성능이 낮은 상태인지 확인하는 Hook */
const useIsLowPerformance = () => {
	const lowPowerMode = useLowPowerMode();

	const [lowRamDevice, setLowRamDevice] = useState(false);

	/** Android 저메모리 기기 표시 조회 */
	useEffect(() => {
		void checkLowRamFeature().then(setLowRamDevice);
	}, []);

	return lowMemoryDevice || lowRamDevice || lowPowerMode;
};

export default useIsLowPerformance;
