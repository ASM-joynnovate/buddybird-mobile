import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BellIcon } from 'lucide-react-native';

import { colors, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { itemStyles } from '@/components/ui/item/styles';

const KIND_LABELS = [
	'settings.notifications.announcement',
	'settings.notifications.report',
	'settings.notifications.marketing',
	'settings.notifications.marketingNight',
] as const;

/** 알림 설정을 불러오는 동안 보이는 컴포넌트 */
const NotificationGroupsSkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<ItemGroup>
				<View style={itemStyles.itemRow}>
					<BellIcon size={22} color={colors.muted} />
					<View style={itemStyles.textContainer}>
						<Copy style={itemStyles.label}>{t('settings.notifications.all')}</Copy>
					</View>
					<View style={styles.switchBlock} />
				</View>
			</ItemGroup>

			<ItemGroup>
				{KIND_LABELS.map((label, index) => (
					<View key={label} style={[itemStyles.itemRow, index > 0 && itemStyles.divider]}>
						<View style={itemStyles.textContainer}>
							<Copy style={itemStyles.label}>{t(label)}</Copy>
						</View>
						<View style={styles.switchBlock} />
					</View>
				))}
			</ItemGroup>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 28 },
	switchBlock: { width: 51, height: 31, borderRadius: radius.pill, backgroundColor: colors.surface },
});

export default NotificationGroupsSkeleton;
