import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BellIcon } from 'lucide-react-native';

import { colors, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { itemStyles } from '@/components/ui/item/styles';

const PLACEHOLDER_ROW_COUNT = 3;

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
				{Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
					<View key={index} style={[itemStyles.itemRow, index > 0 && itemStyles.divider]}>
						<View style={itemStyles.textContainer}>
							<View style={styles.titleBlock} />
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
	titleBlock: { width: 150, height: 16, borderRadius: radius.small, backgroundColor: colors.surface },
	switchBlock: { width: 51, height: 31, borderRadius: radius.pill, backgroundColor: colors.surface },
});

export default NotificationGroupsSkeleton;
