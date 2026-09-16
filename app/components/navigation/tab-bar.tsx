import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { track } from "@/services/telemetry/client"
import { colors, font, radius } from "@/theme"
import type { MainTabParamList } from "@/types/navigation"

const icons: Record<keyof MainTabParamList, IconName> = {
	Learn: "learn",
	Words: "book",
	Profile: "profile",
}

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
	const { t } = useTranslation()

	return (
		<View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 30) }]}>
			{state.routes.map((route, index) => {
				const selected = state.index === index
				const tabName = route.name.toLowerCase()
				const tabLabel = t(`tabs.${tabName}`)

				function selectTab() {
					const event = navigation.emit({
						type: "tabPress",
						target: route.key,
						canPreventDefault: true,
					})

					if (selected || event.defaultPrevented) {
						return
					}

					track("tab_switched", {
						from: state.routes[state.index].name.toLowerCase(),
						to: tabName,
					})
					navigation.navigate(route.name, route.params)
				}

				return (
					<View key={route.key} style={styles.tabCell}>
						<PressableSurface
							testID={`tab-${tabName}`}
							accessibilityRole="tab"
							accessibilityLabel={tabLabel}
							accessibilityState={{ selected }}
							tone={selected ? "primary" : "plain"}
							depth={selected ? 3 : 0}
							cornerRadius={radius.control}
							style={styles.tabTarget}
							contentStyle={styles.tab}
							onPress={selectTab}
						>
							<Icon
								name={icons[route.name as keyof MainTabParamList]}
								color={selected ? colors.onAccent : colors.muted}
								size={25}
							/>
							<Copy
								numberOfLines={1}
								adjustsFontSizeToFit
								style={[styles.tabLabel, selected && { color: colors.onAccent }]}
							>
								{tabLabel}
							</Copy>
						</PressableSurface>
					</View>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		borderTopWidth: 2,
		borderColor: colors.border,
		backgroundColor: colors.background,
		paddingTop: 12,
		paddingHorizontal: 8,
		gap: 6,
	},
	tabCell: { flex: 1, minWidth: 0, maxWidth: 68 },
	tabTarget: { width: "100%", aspectRatio: 1 },
	tab: {
		paddingHorizontal: 8,
		paddingVertical: 8,
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
	},
	tabLabel: {
		fontFamily: font.extraBold,
		fontSize: 11,
		color: colors.muted,
		textAlign: "center",
		alignSelf: "stretch",
	},
})
