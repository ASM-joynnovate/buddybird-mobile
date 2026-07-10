import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';
import { ScrollView } from 'react-native-gesture-handler';

import { BuddyBirdColors, Fonts, withAlpha } from '@/constants/theme';

const ITEM_H = 40;

interface WheelPickerProps {
  accessibilityLabel: string;
  options: number[];
  selected: number;
  onChange: (value: number) => void;
}

export function WheelPicker({ accessibilityLabel, options, selected, onChange }: WheelPickerProps) {
  const ref = useRef<ScrollView>(null);
  const scrollingRef = useRef(false);
  const programmaticRef = useRef(false);
  const [centeredIdx, setCenteredIdx] = useState(() => {
    const idx = options.indexOf(selected);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    if (scrollingRef.current) return;
    const idx = options.indexOf(selected);
    if (idx >= 0) {
      // programmaticRef: 이 scrollTo가 종료될 때 Android에서 발화되는
      // onMomentumScrollEnd가 onChange를 다시 호출해 값을 변동시키지 않도록 가드.
      programmaticRef.current = true;
      ref.current?.scrollTo({ y: idx * ITEM_H, animated: true });
      setCenteredIdx(idx);
    }
  }, [selected, options]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    setCenteredIdx(Math.max(0, Math.min(idx, options.length - 1)));
  }

  function onScrollBeginDrag() {
    scrollingRef.current = true;
    programmaticRef.current = false;
  }

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollingRef.current = false;
    if (programmaticRef.current) {
      programmaticRef.current = false;
      return;
    }
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, options.length - 1));
    setCenteredIdx(clamped);
    onChange(options[clamped]);
  }

  return (
    <ScrollView
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{ now: selected, text: String(selected) }}
      ref={ref}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={50}
      nestedScrollEnabled
      onScrollBeginDrag={onScrollBeginDrag}
      onScroll={onScroll}
      onMomentumScrollEnd={onMomentumEnd}
    >
      {options.map((opt, i) => (
        <View key={opt} style={styles.wheelItemWrapper}>
          <Text style={[styles.wheelItem, i !== centeredIdx && styles.wheelItemFaded]}>
            {opt}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wheel: {
    height: ITEM_H * 5,
    width: 64,
  },
  wheelContent: {
    paddingVertical: ITEM_H * 2,
  },
  wheelItemWrapper: {
    alignItems: 'center',
    height: ITEM_H,
    justifyContent: 'center',
  },
  wheelItem: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 22,
    fontWeight: '900',
  },
  wheelItemFaded: {
    color: withAlpha(BuddyBirdColors.ink, 0.35),
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    fontSize: 18,
  },
});
