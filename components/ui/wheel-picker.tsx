import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { PetHubColors } from '@/constants/theme';

const ITEM_H = 44;

interface WheelPickerProps {
  options: number[];
  selected: number;
  onChange: (value: number) => void;
}

export function WheelPicker({ options, selected, onChange }: WheelPickerProps) {
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
    height: ITEM_H * 3,
    width: 64,
  },
  wheelContent: {
    paddingVertical: ITEM_H,
  },
  wheelItemWrapper: {
    alignItems: 'center',
    height: ITEM_H,
    justifyContent: 'center',
  },
  wheelItem: {
    color: PetHubColors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  wheelItemFaded: {
    color: 'rgba(31,58,61,0.2)',
    fontWeight: '400',
  },
});
