import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BellIcon, ChevronRightIcon, MessageSquareTextIcon, MoonIcon, SmartphoneIcon } from 'lucide-react-native';

import { colors, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { itemStyles } from '@/components/ui/item/styles';

const ROWS = [
	{ icon: MoonIcon, label: 'session.sleep.label', valueWidth: 92 },
	{ icon: BellIcon, label: 'settings.notifications.title', valueWidth: 0 },
	{ icon: MessageSquareTextIcon, label: 'settings.general.language', valueWidth: 48 },
	{ icon: SmartphoneIcon, label: 'settings.general.devices', valueWidth: 0 },
] as const;

/** 일반 설정을 불러오는 동안 보이는 컴포넌트 */
const GeneralGroupSkeleton = () => {
	const { t } = useTranslation();

	return (
		<ItemGroup>
			{ROWS.map(({ icon: Icon, label, valueWidth }, index) => (
				<View key={label} style={[itemStyles.pressRow, index > 0 && itemStyles.divider]}>
					<Icon size={22} color={colors.muted} />
					<View style={itemStyles.textContainer}>
						<Copy style={itemStyles.label}>{t(label)}</Copy>
					</View>
					{valueWidth > 0 && <View style={[styles.valueBlock, { width: valueWidth }]} />}
					<ChevronRightIcon size={18} color={colors.subtle} />
				</View>
			))}
		</ItemGroup>
	);
};

const styles = StyleSheet.create({
	valueBlock: { height: 14, borderRadius: radius.small, backgroundColor: colors.surface },
});

export default GeneralGroupSkeleton;
