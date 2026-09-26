import { colors } from "@/theme/colors"

export * from "@/theme/colors"

export const radius = {
	card: 18,
	control: 16,
	hero: 20,
	pill: 999,
}

export const font = {
	regular: "Pretendard-Regular",
	bold: "Pretendard-Bold",
	extraBold: "Pretendard-ExtraBold",
	black: "Pretendard-Black",
	splash: "Fredoka-SemiBold",
}

export const categoryColors = {
	greeting: {
		color: colors.orange,
		shadow: colors.orangeDark,
		tint: "#FFF7EB",
		soft: "#FFF2E0",
		tone: "primary",
	},
	food: {
		color: colors.blue,
		shadow: colors.blueDark,
		tint: "#EDF9FE",
		soft: "#E4F6FE",
		tone: "blue",
	},
	name: {
		color: colors.purple,
		shadow: colors.purpleDark,
		tint: "#FBF5FF",
		soft: "#F9F0FF",
		tone: "purple",
	},
	etc: {
		color: colors.orange,
		shadow: colors.orangeDark,
		tint: "#FFF7EB",
		soft: "#FFF2E0",
		tone: "primary",
	},
} as const

export const mascot = require("@assets/images/buddy-bird.png")
