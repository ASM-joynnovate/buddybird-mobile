import { type ReactNode, useEffect, useRef } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, contentMaxWidth, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { FixedSheetBackdrop, SheetBackdrop } from '@/components/ui/sheet/backdrop';
import { Title } from '@/components/ui/title';

const LIST_SNAP_POINTS = ['70%'];

interface Props {
	visible: boolean;
	title: string;
	description?: string;
	onClose: () => void;
	listLayout?: boolean;
	onOpened?: () => void;
	headerAction?: ReactNode;
	dismissible?: boolean;
	children: ReactNode;
}

export const Sheet = ({
	visible,
	title,
	description,
	onClose,
	listLayout = false,
	onOpened,
	headerAction,
	dismissible = true,
	children,
}: Props) => {
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();

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

	const header = (
		<View style={styles.header}>
			<View style={styles.titleRow}>
				<Title style={styles.title}>{title}</Title>
				{headerAction}
			</View>
			{!!description && <Copy style={styles.description}>{description}</Copy>}
		</View>
	);

	return (
		<BottomSheetModal
			ref={sheetRef}
			onDismiss={handleDismiss}
			onChange={handleSheetChange}
			enableContentPanningGesture={listLayout}
			enableDynamicSizing={!listLayout}
			enablePanDownToClose={dismissible}
			snapPoints={listLayout ? LIST_SNAP_POINTS : undefined}
			backdropComponent={dismissible ? SheetBackdrop : FixedSheetBackdrop}
			backgroundStyle={styles.background}
			handleIndicatorStyle={styles.handle}
			style={{ marginHorizontal: Math.max(0, (width - contentMaxWidth) / 2) }}
		>
			{listLayout ? (
				<View accessibilityViewIsModal style={styles.listContainer}>
					<View style={styles.listHeader}>{header}</View>
					{children}
				</View>
			) : (
				<BottomSheetView
					accessibilityViewIsModal
					style={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
				>
					{header}
					{children}
				</BottomSheetView>
			)}
		</BottomSheetModal>
	);
};

const styles = StyleSheet.create({
	background: {
		backgroundColor: colors.background,
		borderTopLeftRadius: radius.sheet,
		borderTopRightRadius: radius.sheet,
		borderCurve: 'continuous',
	},
	handle: { width: 40, height: 5, backgroundColor: colors.border },
	contentContainer: { paddingHorizontal: 24, paddingTop: 8, gap: 16 },
	header: { gap: 6 },
	titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	title: { flex: 1, fontSize: 18, lineHeight: 24 },
	description: { color: colors.muted, lineHeight: 21 },
	listContainer: { flex: 1 },
	listHeader: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8 },
});
