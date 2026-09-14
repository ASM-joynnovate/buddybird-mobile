import { BottomTabBarProps } from "@react-navigation/bottom-tabs"

import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { PressableSurface } from "@/components/ui/surface"
import { Icon, IconName } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import { track } from "@/services/telemetry/client"
import { colors, font, radius } from "@/theme"
import { MainTabParamList } from "@/types/navigation"

const icons: Record<keyof MainTabParamList, IconName> = {
	Learn: "learn",
	Words: "book",
	Profile: "profile",
}

export function TabBar({ state, navigation, insets }: BottomTabBarProps) {
	const { t } = useTranslation()

	return (
		<View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
					<PressableSurface
						key={route.key}
						testID={`tab-${tabName}`}
						accessibilityRole="tab"
						accessibilityLabel={tabLabel}
						accessibilityState={{ selected }}
						tone={selected ? "primary" : "plain"}
						cornerRadius={radius.card}
						style={styles.tabCell}
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
		paddingHorizontal: 15,
		gap: 20,
	},
	tabCell: { width: 76 },
	tab: {
		aspectRatio: 1,
		paddingHorizontal: 12,
		paddingVertical: 9,
		alignItems: "center",
		justifyContent: "center",
		gap: 7,
	},
	tabLabel: {
		fontFamily: font.extraBold,
		fontSize: 13,
		color: colors.muted,
		textAlign: "center",
		alignSelf: "stretch",
	},
})
