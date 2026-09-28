import { StyleSheet, View } from 'react-native';

import type { MainTabParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import type { CommonMessages } from '@/i18n/types/common';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
	ChartNoAxesColumnIcon,
	HouseIcon,
	type LucideIcon,
	MessageSquareTextIcon,
	UserIcon,
} from 'lucide-react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const tabs: Record<keyof MainTabParamList, { icon: LucideIcon; label: keyof CommonMessages['tabs'] }> = {
	HomeTab: { icon: HouseIcon, label: 'home' },
	WordsTab: { icon: MessageSquareTextIcon, label: 'words' },
	ReportTab: { icon: ChartNoAxesColumnIcon, label: 'report' },
	ProfileTab: { icon: UserIcon, label: 'profile' },
};

interface Props extends BottomTabBarProps {}

export function TabBar({ state, navigation, insets }: Props) {
	const { t } = useTranslation();

	return (
		<View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 30) }]}>
			{state.routes.map((route, index) => {
				const selected = state.index === index;
				const tab = tabs[route.name as keyof MainTabParamList];
				const TabIcon = tab.icon;
				const tabLabel = t(`common.tabs.${tab.label}`);

				function selectTab() {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
						canPreventDefault: true,
					});

					if (selected || event.defaultPrevented) {
						return;
					}

					navigation.navigate(route.name, route.params);
				}

				return (
					<View key={route.key} style={styles.tabCell}>
						<PressableSurface
							accessibilityRole="tab"
							accessibilityLabel={tabLabel}
							accessibilityState={{ selected }}
							variant={selected ? 'primary' : 'plain'}
							depth={selected ? 'medium' : 'none'}
							cornerRadius="control"
							style={styles.tabTarget}
							contentStyle={styles.tab}
							onPress={selectTab}
						>
							<TabIcon color={selected ? colors.onAccent : colors.muted} size={25} />
							<Copy
								numberOfLines={1}
								adjustsFontSizeToFit
								style={[styles.tabLabel, selected && { color: colors.onAccent }]}
							>
								{tabLabel}
							</Copy>
						</PressableSurface>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	tabBar: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		borderTopWidth: 2,
		borderColor: colors.border,
		backgroundColor: colors.background,
		paddingTop: 12,
		paddingHorizontal: 8,
		gap: 6,
	},
	tabCell: { flex: 1, minWidth: 0, maxWidth: 68 },
	tabTarget: { width: '100%', aspectRatio: 1 },
	tab: {
		paddingHorizontal: 8,
		paddingVertical: 8,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
	},
	tabLabel: {
		fontFamily: font.extraBold,
		fontSize: 11,
		color: colors.muted,
		textAlign: 'center',
		alignSelf: 'stretch',
	},
});
