import { type PropsWithChildren, useEffect, useRef } from 'react';

import { StyleSheet, View } from 'react-native';

import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth } from '@/theme';

import { SheetBackdrop } from '@/components/ui/sheet/backdrop';
import { Title } from '@/components/ui/title';

const SHEET_RADIUS = 28;
const LIST_SNAP_POINTS = ['70%'];

interface Props {
	visible: boolean;
	title: string;
	onClose(): void;
	list?: boolean;
	onOpened?(): void;
}

export function Sheet({ visible, title, onClose, list = false, onOpened, children }: PropsWithChildren<Props>) {
	const insets = useSafeAreaInsets();

	const ref = useRef<BottomSheetModal>(null);
	const presented = useRef(false);

	useEffect(() => {
		if (visible) {
			presented.current = true;
			ref.current?.present();
		} else if (presented.current) {
			presented.current = false;
			ref.current?.dismiss();
		}
	}, [visible]);

	return (
		<BottomSheetModal
			ref={ref}
			onDismiss={() => {
				presented.current = false;
				onClose();
			}}
			onChange={(index) => {
				if (index === 0) {
					onOpened?.();
				}
			}}
			enableContentPanningGesture={list}
			enableDynamicSizing={!list}
			snapPoints={list ? LIST_SNAP_POINTS : undefined}
			backdropComponent={SheetBackdrop}
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
	);
}

const styles = StyleSheet.create({
	sheet: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
	background: {
		backgroundColor: colors.background,
		borderTopLeftRadius: SHEET_RADIUS,
		borderTopRightRadius: SHEET_RADIUS,
		borderCurve: 'continuous',
	},
	handle: { width: 40, height: 5, backgroundColor: colors.border },
	content: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
	title: { fontSize: 18, lineHeight: 24 },
	list: { flex: 1 },
	listTitle: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
});
