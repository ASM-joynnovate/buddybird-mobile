import { StyleSheet, View } from 'react-native';

const BAR_HEIGHTS = [18, 32, 24, 48, 30, 56, 22, 38, 28, 50, 20, 44, 34, 26, 52, 24, 40, 36, 18, 42, 28, 54, 22, 46, 32, 20, 50, 30, 44, 24];
//바 동적 움직임 체크 필요

interface WaveformBarsProps {
  color?: string;
  height?: number;
  barCount?: number;
}

export function WaveformBars({ color = '#2A9D8F', height = 40, barCount = 28 }: WaveformBarsProps) {
  const bars = BAR_HEIGHTS.slice(0, barCount);
  const maxH = Math.max(...bars);

  return (
    <View style={[styles.container, { height }]}>
      {bars.map((h, i) => {
        const scaled = (h / maxH) * height * 0.9 + height * 0.1;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: scaled,
                backgroundColor: color,
                opacity: i > 4 && i < barCount - 4 ? 1 : 0.45,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
    width: 4,
  },
});
