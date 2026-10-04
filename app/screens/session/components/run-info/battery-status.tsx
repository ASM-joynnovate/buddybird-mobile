import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import {
	addBatteryLevelListener,
	addBatteryStateListener,
	BatteryState,
	getBatteryLevelAsync,
	getBatteryStateAsync,
} from 'expo-battery';
import { BatteryChargingIcon, BatteryIcon } from 'lucide-react-native';

import { reportError } from '@/services/telemetry/client';
import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

const ICON_SIZE = 18;

/** 배터리 상태 컴포넌트 */
const BatteryStatus = () => {
	const { t } = useTranslation();

	const [batteryLevel, setBatteryLevel] = useState(-1);
	const [batteryState, setBatteryState] = useState(BatteryState.UNKNOWN);

	/** 배터리 변경 이벤트 구독 */
	useEffect(() => {
		/** 배터리 잔량 조회 함수 */
		const refreshBatteryLevel = () =>
			void getBatteryLevelAsync()
				.then(setBatteryLevel)
				.catch((error: unknown) => reportError(error, 'battery_level'));

		refreshBatteryLevel();

		void getBatteryStateAsync()
			.then(setBatteryState)
			.catch((error: unknown) => reportError(error, 'battery_state'));

		const levelSubscription = addBatteryLevelListener((event) => setBatteryLevel(event.batteryLevel));

		// Android는 잔량이 바뀔 때 이 이벤트만 보냄
		const stateSubscription = addBatteryStateListener((event) => {
			setBatteryState(event.batteryState);

			refreshBatteryLevel();
		});

		return () => {
			levelSubscription.remove();
			stateSubscription.remove();
		};
	}, []);

	if (batteryLevel < 0) {
		return null;
	}

	const isCharging = batteryState === BatteryState.CHARGING;
	const levelText = t('session.run.batteryLevel', { percent: Math.round(batteryLevel * 100) });

	return (
		<View
			style={styles.container}
			accessible
			accessibilityLabel={joinLabel(t('session.run.battery'), levelText, isCharging && t('session.run.charging'))}
		>
			{isCharging ? (
				<BatteryChargingIcon size={ICON_SIZE} color={sessionColors.faint} />
			) : (
				<BatteryIcon size={ICON_SIZE} color={sessionColors.faint} />
			)}
			<Copy style={styles.level}>{levelText}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	level: { fontFamily: font.extraBold, fontSize: 13, color: sessionColors.faint, fontVariant: ['tabular-nums'] },
});

export default BatteryStatus;
