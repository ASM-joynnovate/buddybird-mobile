export const colors = {
	brand: "#DB030F",
	background: "#ffffff",
	onAccent: "#ffffff",
	text: "#3c3c3c",
	muted: "#777777",
	border: "#e5e5e5",
	surface: "#f7f7f7",
	orange: "#ff9600",
	orangeDark: "#e07f00",
	orangeSoft: "#FFE8CC",
	orangeSelected: "#fff7eb",
	blue: "#1cb0f6",
	blueDark: "#1899d6",
	blueSoft: "#DDF4FF",
	purple: "#ce82ff",
	purpleSoft: "#F2E1FF",
	purpleDark: "#A85FD6",
	yellow: "#FFC800",
	yellowDark: "#E6A800",
	scrim: "#00000066",
	disabledBackground: "#EBEBEB",
	error: "#FF4B4B",
	disabled: "#AFAFAF",
}

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
	display: "Nunito-Black",
	displayBold: "Nunito-Bold",
	rounded: "Nunito-ExtraBold",
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
