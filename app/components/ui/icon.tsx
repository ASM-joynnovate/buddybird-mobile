import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { SymbolView, type SymbolViewProps } from "expo-symbols"
import type { ComponentProps } from "react"
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
	book: ["book.fill", "menu-book"],
	profile: ["person.fill", "person"],
	clock: ["clock.fill", "schedule"],
	flame: ["flame.fill", "local-fire-department"],
	lock: ["lock.fill", "lock"],
	send: ["paperplane.fill", "send"],
	edit: ["pencil", "edit"],
	close: ["xmark", "close"],
	home: ["house.fill", "home"],
	words: ["text.bubble.fill", "chat-bubble"],
	report: ["chart.bar.fill", "bar-chart"],
	bell: ["bell.fill", "notifications"],
	gear: ["gearshape.fill", "settings"],
	moon: ["moon.fill", "bedtime"],
	sun: ["sun.max.fill", "wb-sunny"],
	wifiOff: ["wifi.slash", "wifi-off"],
	warning: ["exclamationmark.triangle.fill", "warning"],
	forward: ["chevron.right", "chevron-right"],
	help: ["questionmark.circle", "help-outline"],
	notice: ["megaphone.fill", "campaign"],
	mimicry: ["waveform", "graphic-eq"],
	device: ["iphone", "smartphone"],
	photo: ["photo", "image"],
	refresh: ["arrow.clockwise", "refresh"],
} as const satisfies Record<
	string,
	readonly [SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]]
>

export type IconName = keyof typeof symbols

interface Props {
	name: IconName
	size?: number
	color?: string
	weight?: SymbolViewProps["weight"]
}

export function Icon({ name, size = 24, color = colors.text, weight }: Props) {
	return Platform.OS === "ios" ? (
		<SymbolView
			name={symbols[name][0]}
			tintColor={color}
			size={size}
			weight={weight}
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
