import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import {
	BellIcon,
	ChevronRightIcon,
	EarthIcon,
	MessageSquareTextIcon,
	MoonIcon,
	SmartphoneIcon,
} from 'lucide-react-native';

import { colors, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { itemStyles } from '@/components/ui/item/styles';

const GENERAL_ITEMS = [
	{ icon: MoonIcon, labelKey: 'session.sleep.label', valueWidth: 92 },
	{ icon: BellIcon, labelKey: 'settings.notifications.title', valueWidth: 0 },
	{ icon: MessageSquareTextIcon, labelKey: 'settings.general.language', valueWidth: 48 },
	{ icon: EarthIcon, labelKey: 'settings.general.country', valueWidth: 64 },
	{ icon: SmartphoneIcon, labelKey: 'settings.general.devices', valueWidth: 0 },
] as const;

/** 일반 설정 스켈레톤 컴포넌트 */
const GeneralGroupSkeleton = () => {
	const { t } = useTranslation();

	return (
		<ItemGroup>
			{GENERAL_ITEMS.map(({ icon: Icon, labelKey, valueWidth }, index) => (
				<View key={labelKey} style={[itemStyles.pressRow, index > 0 && itemStyles.divider]}>
					<Icon size={22} color={colors.muted} />
					<View style={itemStyles.textContainer}>
						<Copy style={itemStyles.label}>{t(labelKey)}</Copy>
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
