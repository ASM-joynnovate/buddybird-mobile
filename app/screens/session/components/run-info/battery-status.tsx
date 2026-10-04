import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BatteryState, usePowerState } from 'expo-battery';
import { BatteryChargingIcon, BatteryIcon } from 'lucide-react-native';

import { font } from '@/theme';
import { sessionColors } from '@/theme/session-colors';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

const ICON_SIZE = 18;

/** 배터리 상태 컴포넌트 */
const BatteryStatus = () => {
	const { t } = useTranslation();

	const { batteryLevel, batteryState } = usePowerState();

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
