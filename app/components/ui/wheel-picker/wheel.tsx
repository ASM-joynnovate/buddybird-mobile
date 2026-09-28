import { useEffect, useRef, useState } from 'react';

import { type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

export const WHEEL_ITEM_HEIGHT = 40;

interface Props {
	value: number;
	values: readonly number[];
	label: string;
	onChange(value: number): void;
}

export function WheelPickerWheel({ value, values, label, onChange }: Props) {
	const scroll = useRef<ScrollView>(null);
	const dragging = useRef(false);

	const selectedIndex = Math.max(0, values.indexOf(value));

	const [initialOffset] = useState(() => ({ x: 0, y: selectedIndex * WHEEL_ITEM_HEIGHT }));
	const [centeredIndex, setCenteredIndex] = useState(selectedIndex);

	useEffect(() => {
		if (!dragging.current) {
			scroll.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_HEIGHT, animated: false });

			setCenteredIndex(selectedIndex);
		}
	}, [selectedIndex]);

	function indexAt(offset: number) {
		return Math.max(0, Math.min(values.length - 1, Math.round(offset / WHEEL_ITEM_HEIGHT)));
	}

	function finishScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
		if (!dragging.current) {
			return;
		}

		dragging.current = false;

		const index = indexAt(event.nativeEvent.contentOffset.y);

		setCenteredIndex(index);

		onChange(values[index]);
	}

	return (
		<ScrollView
			ref={scroll}
			accessible
			accessibilityLabel={label}
			accessibilityRole="adjustable"
			accessibilityValue={{
				min: values[0],
				max: values[values.length - 1],
				now: value,
			}}
			accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
			onAccessibilityAction={({ nativeEvent: { actionName } }) => {
				if (actionName === 'increment' || actionName === 'decrement') {
					const next =
						values[
							Math.max(
								0,
								Math.min(values.length - 1, selectedIndex + (actionName === 'increment' ? 1 : -1)),
							)
						];

					onChange(next);
				}
			}}
			style={styles.wheel}
			contentContainerStyle={styles.content}
			contentOffset={initialOffset}
			snapToInterval={WHEEL_ITEM_HEIGHT}
			decelerationRate="fast"
			showsVerticalScrollIndicator={false}
			scrollEventThrottle={50}
			nestedScrollEnabled
			onScrollBeginDrag={() => {
				dragging.current = true;
			}}
			onScroll={(event) => setCenteredIndex(indexAt(event.nativeEvent.contentOffset.y))}
			onScrollEndDrag={(event) => {
				if (event.nativeEvent.velocity?.y === 0) {
					finishScroll(event);
				}
			}}
			onMomentumScrollEnd={finishScroll}
		>
			{values.map((item, index) => (
				<View key={item} style={styles.item}>
					<Copy style={index === centeredIndex ? styles.selectedText : styles.text}>{item}</Copy>
				</View>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	wheel: { height: WHEEL_ITEM_HEIGHT * 5, flex: 1, minWidth: 0 },
	content: { paddingVertical: WHEEL_ITEM_HEIGHT * 2 },
	item: { height: WHEEL_ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
	selectedText: { fontFamily: font.black, fontSize: 22, color: colors.text },
	text: { fontFamily: font.bold, fontSize: 18, color: colors.wheelText },
});
