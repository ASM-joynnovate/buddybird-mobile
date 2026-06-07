import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const BAR_HEIGHTS = [18, 32, 24, 48, 30, 56, 22, 38, 28, 50, 20, 44, 34, 26, 52, 24, 40, 36, 18, 42, 28, 54, 22, 46, 32, 20, 50, 30, 44, 24];

interface WaveformBarsProps {
  color?: string;
  height?: number;
  barCount?: number;
  animated?: boolean;
  frozen?: boolean;
  flatLine?: boolean;
}

export function WaveformBars({ color = '#2A9D8F', height = 60, barCount = 28, animated = false, frozen = false, flatLine = false }: WaveformBarsProps) {
  const bars = BAR_HEIGHTS.slice(0, barCount);
  const maxH = Math.max(...bars);

  const animValues = useRef<Animated.Value[]>(
    bars.map((h) => new Animated.Value((h / maxH) * height * 0.9 + height * 0.1))
  ).current;

  useEffect(() => {
    if (animated) {
      let active = true;
      function animateLoop() {
        if (!active) return;
        const anims = animValues.map((av, i) => {
          const centreWeight = 1 - Math.abs(i - bars.length / 2) / (bars.length / 2);
          const targetNorm = Math.max(0.08, centreWeight * 0.55 + (Math.random() - 0.5) * 0.3);
          return Animated.timing(av, {
            toValue: targetNorm * height * 0.9 + height * 0.1,
            duration: 180,
            useNativeDriver: false,
          });
        });
        Animated.parallel(anims).start(({ finished }) => {
          if (finished && active) animateLoop();
        });
      }
      animateLoop();
      return () => { active = false; };
    }

    if (frozen) return;

    if (flatLine) {
      Animated.parallel(
        animValues.map((av) =>
          Animated.timing(av, { toValue: 10, duration: 200, useNativeDriver: false })
        )
      ).start();
      return;
    }

    Animated.parallel(
      bars.map((h, i) =>
        Animated.timing(animValues[i], {
          toValue: (h / maxH) * height * 0.9 + height * 0.1,
          duration: 200,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [animated, frozen, flatLine, height]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.container, { height }]}>
      {animValues.map((animValue, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: animValue,
              backgroundColor: color,
              opacity: 1
            },
          ]}
        />
      ))}
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
