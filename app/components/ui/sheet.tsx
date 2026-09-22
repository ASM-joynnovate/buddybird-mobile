import {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetView,
} from "@gorhom/bottom-sheet"
import { type PropsWithChildren, useEffect, useRef } from "react"
import { StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Title } from "@/components/ui/text"
import { colors } from "@/theme"

const SHEET_RADIUS = 28
const LIST_SNAP_POINTS = ["70%"]

export function Sheet({
	visible,
	title,
	onClose,
	list = false,
	onOpened,
	children,
}: PropsWithChildren<{
	visible: boolean
	title: string
	onClose(): void
	list?: boolean
	onOpened?(): void
}>) {
	const ref = useRef<BottomSheetModal>(null)
	const presented = useRef(false)
	const insets = useSafeAreaInsets()

	useEffect(() => {
		if (visible) {
			presented.current = true
			ref.current?.present()
		} else if (presented.current) {
			presented.current = false
			ref.current?.dismiss()
		}
	}, [visible])

	return (
		<BottomSheetModal
			ref={ref}
			onDismiss={() => {
				presented.current = false
				onClose()
			}}
			onChange={(index) => {
				if (index === 0) {
					onOpened?.()
				}
			}}
			enableContentPanningGesture={list}
			enableDynamicSizing={!list}
			snapPoints={list ? LIST_SNAP_POINTS : undefined}
			backdropComponent={Backdrop}
			backgroundStyle={styles.background}
			handleIndicatorStyle={styles.handle}
			style={styles.sheet}
		>
			{list ? (
				<View accessibilityViewIsModal style={styles.list}>
					<Title style={[styles.title, styles.listTitle]}>{title}</Title>
					{children}
				</View>
			) : (
				<BottomSheetView
					accessibilityViewIsModal
					style={[styles.content, { paddingBottom: insets.bottom + 20 }]}
				>
					<Title style={styles.title}>{title}</Title>
					{children}
				</BottomSheetView>
			)}
		</BottomSheetModal>
	)
}

function Backdrop(props: BottomSheetBackdropProps) {
	return (
		<BottomSheetBackdrop
			{...props}
			appearsOnIndex={0}
			disappearsOnIndex={-1}
			opacity={1}
			style={[props.style, styles.backdrop]}
		/>
	)
}

const styles = StyleSheet.create({
	sheet: { width: "100%", maxWidth: 480, alignSelf: "center" },
	background: {
		backgroundColor: colors.background,
		borderTopLeftRadius: SHEET_RADIUS,
		borderTopRightRadius: SHEET_RADIUS,
		borderCurve: "continuous",
	},
	handle: { width: 40, height: 5, backgroundColor: colors.border },
	backdrop: { backgroundColor: colors.scrim },
	content: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
	title: { fontSize: 18, lineHeight: 24 },
	list: { flex: 1 },
	listTitle: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
})
