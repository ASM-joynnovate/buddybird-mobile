import { Image, StyleSheet, View } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { colors } from "@/theme"

const iconSizes = { medium: 26, large: 34, xlarge: 40 } as const

export type AvatarSize = keyof typeof iconSizes

interface Props {
	uri?: string | null
	icon: IconName
	size: AvatarSize
}

function sizeStyle(size: AvatarSize) {
	return { medium: styles.medium, large: styles.large, xlarge: styles.xlarge }[size]
}

export function Avatar({ uri, icon, size }: Props) {
	return (
		<View style={[styles.circle, sizeStyle(size)]}>
			{uri ? (
				<Image source={{ uri }} style={styles.image} />
			) : (
				<Icon name={icon} size={iconSizes[size]} color={colors.disabled} />
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	circle: {
		overflow: "hidden",
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	medium: { width: 64, height: 64, borderRadius: 32 },
	large: { width: 80, height: 80, borderRadius: 40 },
	xlarge: { width: 110, height: 110, borderRadius: 55 },
	image: { width: "100%", height: "100%" },
})
