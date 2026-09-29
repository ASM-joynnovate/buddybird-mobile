import { type ReactNode, useEffect, useRef } from 'react';

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
	onClose: () => void;
	listLayout?: boolean;
	onOpened?: () => void;
	children: ReactNode;
}

export const Sheet = ({ visible, title, onClose, listLayout = false, onOpened, children }: Props) => {
	const insets = useSafeAreaInsets();

	const sheetRef = useRef<BottomSheetModal>(null);
	const presentedRef = useRef(false);

	useEffect(() => {
		if (visible) {
			presentedRef.current = true;
			sheetRef.current?.present();
		} else if (presentedRef.current) {
			presentedRef.current = false;
			sheetRef.current?.dismiss();
		}
	}, [visible]);

	const handleDismiss = () => {
		presentedRef.current = false;
		onClose();
	};

	const handleSheetChange = (index: number) => {
		if (index === 0) {
			onOpened?.();
		}
	};

	return (
		<BottomSheetModal
			ref={sheetRef}
			onDismiss={handleDismiss}
			onChange={handleSheetChange}
			enableContentPanningGesture={listLayout}
			enableDynamicSizing={!listLayout}
			snapPoints={listLayout ? LIST_SNAP_POINTS : undefined}
			backdropComponent={SheetBackdrop}
			backgroundStyle={styles.background}
			handleIndicatorStyle={styles.handle}
			style={styles.sheet}
		>
			{listLayout ? (
				<View accessibilityViewIsModal style={styles.listContainer}>
					<Title style={[styles.title, styles.listTitle]}>{title}</Title>
					{children}
				</View>
			) : (
				<BottomSheetView
					accessibilityViewIsModal
					style={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
				>
					<Title style={styles.title}>{title}</Title>
					{children}
				</BottomSheetView>
			)}
		</BottomSheetModal>
	);
};

const styles = StyleSheet.create({
	sheet: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
	background: {
		backgroundColor: colors.background,
		borderTopLeftRadius: SHEET_RADIUS,
		borderTopRightRadius: SHEET_RADIUS,
		borderCurve: 'continuous',
	},
	handle: { width: 40, height: 5, backgroundColor: colors.border },
	contentContainer: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
	title: { fontSize: 18, lineHeight: 24 },
	listContainer: { flex: 1 },
	listTitle: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
});
