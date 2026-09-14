import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { SymbolView, SymbolViewProps } from "expo-symbols"
import { ComponentProps } from "react"
import { Platform } from "react-native"

import { colors } from "@/theme"

const symbols = {
	plus: ["plus", "add"],
	back: ["chevron.left", "chevron-left"],
	play: ["play.fill", "play-arrow"],
	pause: ["pause.fill", "pause"],
	stop: ["stop.fill", "stop"],
	check: ["checkmark", "check"],
	mic: ["mic.fill", "mic"],
	trash: ["trash", "delete-outline"],
	volume: ["speaker.wave.2.fill", "volume-up"],
	learn: ["dumbbell", "fitness-center"],
	book: ["book.fill", "menu-book"],
	profile: ["person.fill", "person"],
	clock: ["clock.fill", "schedule"],
	flame: ["flame.fill", "local-fire-department"],
	lock: ["lock.fill", "lock"],
	send: ["paperplane.fill", "send"],
	edit: ["pencil", "edit"],
	close: ["xmark", "close"],
} as const satisfies Record<
	string,
	readonly [SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]]
>

export type IconName = keyof typeof symbols

export function Icon({
	name,
	size = 24,
	color = colors.text,
}: {
	name: IconName
	size?: number
	color?: string
}) {
	return Platform.OS === "ios" ? (
		<SymbolView
			name={symbols[name][0]}
			tintColor={color}
			size={size}
			style={{ width: size, height: size }}
			accessibilityElementsHidden
		/>
	) : (
		<MaterialIcons
			name={symbols[name][1]}
			size={size}
			color={color}
			accessible={false}
			importantForAccessibility="no"
		/>
	)
}
