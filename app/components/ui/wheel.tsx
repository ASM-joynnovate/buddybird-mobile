import { type PropsWithChildren, useEffect, useRef, useState } from "react"
import { type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from "react-native"
import { ScrollView } from "react-native-gesture-handler"

import { Copy } from "@/components/ui/text"
import { colors, font } from "@/theme"

const itemHeight = 40

export function WheelRow({ children }: PropsWithChildren) {
	return (
		<View style={styles.row}>
			<View pointerEvents="none" style={styles.selection} />
			{children}
		</View>
	)
}

export function Wheel({
	value,
	values,
	onChange,
	label,
	testID,
}: {
	value: number
	values: readonly number[]
	onChange(value: number): void
	label: string
	testID: string
}) {
	const scroll = useRef<ScrollView>(null)
	const dragging = useRef(false)
	const selectedIndex = Math.max(0, values.indexOf(value))
	const [initialOffset] = useState(() => ({ x: 0, y: selectedIndex * itemHeight }))
	const [centeredIndex, setCenteredIndex] = useState(selectedIndex)

	useEffect(() => {
		if (!dragging.current) {
			scroll.current?.scrollTo({ y: selectedIndex * itemHeight, animated: false })
			setCenteredIndex(selectedIndex)
		}
	}, [selectedIndex])

	function indexAt(offset: number) {
		return Math.max(0, Math.min(values.length - 1, Math.round(offset / itemHeight)))
	}

	function finishScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
		if (!dragging.current) {
			return
		}

		dragging.current = false

		const index = indexAt(event.nativeEvent.contentOffset.y)

		setCenteredIndex(index)
		onChange(values[index])
	}

	return (
		<ScrollView
			ref={scroll}
			testID={testID}
			accessible
			accessibilityLabel={label}
			accessibilityRole="adjustable"
			accessibilityValue={{
				min: values[0],
				max: values[values.length - 1],
				now: value,
			}}
			accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
			onAccessibilityAction={({ nativeEvent: { actionName } }) => {
				if (actionName === "increment" || actionName === "decrement") {
					const next =
						values[
							Math.max(
								0,
								Math.min(
									values.length - 1,
									selectedIndex + (actionName === "increment" ? 1 : -1),
								),
							)
						]

					onChange(next)
				}
			}}
			style={styles.wheel}
			contentContainerStyle={styles.content}
			contentOffset={initialOffset}
			snapToInterval={itemHeight}
			decelerationRate="fast"
			showsVerticalScrollIndicator={false}
			scrollEventThrottle={50}
			nestedScrollEnabled
			onScrollBeginDrag={() => {
				dragging.current = true
			}}
			onScroll={(event) => setCenteredIndex(indexAt(event.nativeEvent.contentOffset.y))}
			onScrollEndDrag={(event) => {
				if (event.nativeEvent.velocity?.y === 0) {
					finishScroll(event)
				}
			}}
			onMomentumScrollEnd={finishScroll}
		>
			{values.map((item, index) => (
				<View key={item} style={styles.item}>
					<Copy style={index === centeredIndex ? styles.selectedText : styles.text}>
						{item}
					</Copy>
				</View>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
	wheel: { height: itemHeight * 5, flex: 1, minWidth: 0 },
	content: { paddingVertical: itemHeight * 2 },
	item: { height: itemHeight, alignItems: "center", justifyContent: "center" },
	selectedText: { fontFamily: font.black, fontSize: 22, color: colors.text },
	text: { fontFamily: font.bold, fontSize: 18, color: `${colors.text}59` },
	selection: {
		position: "absolute",
		top: itemHeight * 2,
		height: itemHeight,
		left: 0,
		right: 0,
		borderWidth: 2,
		borderRadius: 12,
		borderColor: colors.orange,
		backgroundColor: `${colors.orange}0f`,
	},
})
