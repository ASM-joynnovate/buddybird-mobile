import type { ReactElement, ReactNode, RefObject } from 'react';

import { type ListRenderItemInfo, StyleSheet, View } from 'react-native';

import { BottomSheetFlatList, type BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetSearchField } from '@/components/ui/sheet/search-field';

interface Props<Item> {
	query: string;
	placeholder: string;
	clearLabel: string;
	filters?: ReactNode;
	items: readonly Item[];
	listRef?: RefObject<BottomSheetFlatListMethods | null>;
	initialNumToRender?: number;
	emptyContent: ReactElement;
	keyExtractor: (item: Item) => string;
	renderItem: (item: Item, index: number) => ReactElement;
	onChangeQuery: (query: string) => void;
	onScrollToIndexFailed?: () => void;
}

export const SheetSearchList = <Item,>({
	query,
	placeholder,
	clearLabel,
	filters,
	items,
	listRef,
	initialNumToRender,
	emptyContent,
	keyExtractor,
	renderItem,
	onChangeQuery,
	onScrollToIndexFailed,
}: Props<Item>) => {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.container}>
			<View style={styles.controlsContainer}>
				<SheetSearchField
					value={query}
					placeholder={placeholder}
					clearLabel={clearLabel}
					onChangeText={onChangeQuery}
				/>
				{filters}
			</View>

			<BottomSheetFlatList
				ref={listRef}
				data={items}
				keyExtractor={keyExtractor}
				initialNumToRender={initialNumToRender}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				onScrollToIndexFailed={onScrollToIndexFailed}
				contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
				renderItem={({ item, index }: ListRenderItemInfo<Item>) => renderItem(item, index)}
				ListEmptyComponent={emptyContent}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	controlsContainer: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8, gap: 12 },
	listContent: { paddingHorizontal: 10 },
});
