import { type PropsWithChildren, type ReactNode, useEffect } from "react"
import { ActivityIndicator, StyleSheet, Switch, View } from "react-native"
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"
import Svg, { Polyline } from "react-native-svg"

import { Icon, type IconName } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { colors, font, radius } from "@/theme"

export function GroupedList({ children, title }: PropsWithChildren<{ title?: string }>) {
	return (
		<View style={styles.group}>
			{title ? (
				<Copy accessibilityRole="header" style={styles.groupTitle}>
					{title}
				</Copy>
			) : null}
			<View style={styles.list}>{children}</View>
		</View>
	)
}

type RowProps = {
	label: string
	icon?: IconName
	detail?: string
	first?: boolean
}

function RowLabel({ label, icon, detail }: RowProps) {
	return (
		<>
			{icon ? <Icon name={icon} size={22} color={colors.muted} /> : null}
			<View style={styles.labels}>
				<Copy style={styles.label}>{label}</Copy>
				{detail ? <Copy style={styles.detail}>{detail}</Copy> : null}
			</View>
		</>
	)
}

export function NavRow({
	value,
	dot,
	onPress,
	disabled,
	expanded,
	trailing,
	...props
}: RowProps & {
	value?: string
	dot?: boolean
	disabled?: boolean
	expanded?: boolean
	trailing?: ReactNode
	onPress(): void
}) {
	return (
		<PressableSurface
			accessibilityLabel={[props.label, value].filter(Boolean).join(", ")}
			accessibilityState={{ expanded }}
			disabled={disabled}
			onPress={onPress}
			tone="plain"
			depth={0}
			cornerRadius={0}
			style={!props.first && styles.divider}
			contentStyle={styles.pressRow}
		>
			<RowLabel {...props} />
			{dot ? <View style={styles.dot} /> : null}
			{value ? <Copy style={styles.value}>{value}</Copy> : null}
			{trailing ?? <Icon name="forward" size={18} color={colors.disabled} />}
		</PressableSurface>
	)
}

export function SwitchRow({
	value,
	onChange,
	disabled,
	busy,
	...props
}: RowProps & {
	value: boolean
	disabled?: boolean
	busy?: boolean
	onChange(value: boolean): void
}) {
	return (
		<View style={[styles.row, !props.first && styles.divider]}>
			<RowLabel {...props} />
			{busy ? <ActivityIndicator color={colors.orange} /> : null}
			<Switch
				accessibilityLabel={props.label}
				value={value}
				disabled={disabled || busy}
				onValueChange={onChange}
				trackColor={{ false: colors.border, true: colors.orange }}
				thumbColor={colors.background}
				ios_backgroundColor={colors.border}
			/>
		</View>
	)
}

export function CheckRow({
	checked,
	onToggle,
	disabled,
	trailing,
	caption,
	captionTone = "muted",
	...props
}: RowProps & {
	checked: boolean
	disabled?: boolean
	trailing?: ReactNode
	caption?: string
	captionTone?: "primary" | "muted"
	onToggle(): void
}) {
	return (
		<PressableSurface
			accessibilityRole="checkbox"
			accessibilityLabel={props.label}
			accessibilityState={{ checked }}
			disabled={disabled}
			onPress={onToggle}
			tone="plain"
			depth={0}
			cornerRadius={0}
			style={!props.first && styles.divider}
			contentStyle={styles.pressRow}
		>
			<View style={styles.labels}>
				{caption ? (
					<Copy
						style={[styles.caption, captionTone === "primary" && styles.captionPrimary]}
					>
						{caption}
					</Copy>
				) : null}
				<Copy style={styles.label}>{props.label}</Copy>
				{props.detail ? <Copy style={styles.detail}>{props.detail}</Copy> : null}
			</View>
			{trailing}
			<CheckBox checked={checked} disabled={disabled} onPress={onToggle} />
		</PressableSurface>
	)
}

const CHECK_SIZE = 14
const CHECK_DEPTH = 3

function CheckBox({
	checked,
	disabled,
	onPress,
}: {
	checked: boolean
	disabled?: boolean
	onPress(): void
}) {
	const reduced = useReducedMotion()
	const pop = useSharedValue(1)
	const mark = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }] }))

	useEffect(() => {
		if (checked && !reduced) {
			pop.set(0.7)
			pop.set(withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }))
		}
	}, [checked, reduced, pop])

	let tone: "primary" | "neutral" | "muted" = checked ? "primary" : "neutral"

	if (disabled) {
		tone = "muted"
	}

	return (
		<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<PressableSurface
				onPress={onPress}
				disabled={disabled}
				tone={tone}
				depth={disabled ? 0 : CHECK_DEPTH}
				cornerRadius={8}
				style={[styles.box, disabled && { marginTop: CHECK_DEPTH }]}
				contentStyle={styles.boxFace}
			>
				<Animated.View style={mark}>
					<Svg width={CHECK_SIZE} height={CHECK_SIZE} viewBox="0 0 14 14">
						<Polyline
							points="2.5,7.5 5.8,10.5 11.5,3.8"
							fill="none"
							stroke={checked && !disabled ? colors.onAccent : colors.disabled}
							strokeWidth={3}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</Svg>
				</Animated.View>
			</PressableSurface>
		</View>
	)
}

const styles = StyleSheet.create({
	group: { gap: 10 },
	groupTitle: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	list: {
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: "continuous",
		overflow: "hidden",
		backgroundColor: colors.background,
	},
	row: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	pressRow: {
		minHeight: 56,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderWidth: 0,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	labels: { flex: 1, minWidth: 0, gap: 2 },
	label: { fontFamily: font.extraBold, fontSize: 16, color: colors.text },
	detail: { fontSize: 13, color: colors.muted },
	caption: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	captionPrimary: { color: colors.orangeDark },
	value: { fontFamily: font.bold, fontSize: 14, color: colors.muted, flexShrink: 1 },
	dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
	box: { width: 26 },
	boxFace: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
})
