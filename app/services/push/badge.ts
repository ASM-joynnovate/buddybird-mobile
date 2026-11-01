import notifee from 'react-native-notify-kit';

import { reportError } from '@/services/telemetry/client';

/** 앱 아이콘 배지 숫자 변경 함수 */
export const setBadgeCount = (count: number) =>
	notifee.setBadgeCount(count).catch((error) => reportError(error, 'badge_count'));
