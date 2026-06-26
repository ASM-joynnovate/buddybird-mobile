import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { BuddyBirdColors, Motion, Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const BAR_HEIGHTS = [
  18, 32, 24, 48, 30, 56, 22, 38, 28, 50, 20, 44, 34, 26, 52, 24,
  40, 36, 18, 42, 28, 54, 22, 46, 32, 20, 50, 30, 44, 24, 34, 52,
  26, 46, 22, 58, 30, 48, 18, 42, 28, 54, 24, 38, 32, 50, 20, 44,
];

interface WaveformBarsProps {
  color?: string;
  height?: number;
  barCount?: number;
  animated?: boolean;
  frozen?: boolean;
  flatLine?: boolean;
  fill?: boolean;
}

export function WaveformBars({
  color = BuddyBirdColors.secondary,
  height = 60,
  barCount = 28,
  animated = false,
  frozen = false,
  flatLine = false,
  fill = false,
}: WaveformBarsProps) {
  const reducedMotion = useReducedMotion();
  const bars = BAR_HEIGHTS.slice(0, barCount);
  const maxH = Math.max(...bars);

  // Animated.Value 배열은 렌더마다 새로 만들지 않고 첫 렌더에서 한 번만 초기화한다.
  const animValuesRef = useRef<Animated.Value[]>(null!);
  if (animValuesRef.current === null) {
    animValuesRef.current = bars.map((h) => new Animated.Value((h / maxH) * height * 0.9 + height * 0.1));
  }
  const animValues = animValuesRef.current;

  useEffect(() => {
    if (animated && !reducedMotion) {
      let active = true;
      function animateLoop() {
        if (!active) return;
        const anims = animValues.map((av, i) => {
          const centreWeight = 1 - Math.abs(i - bars.length / 2) / (bars.length / 2);
          const targetNorm = Math.max(0.08, centreWeight * 0.55 + (Math.random() - 0.5) * 0.3);
          return Animated.timing(av, {
            toValue: targetNorm * height * 0.9 + height * 0.1,
            duration: Motion.baseMs,
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
          Animated.timing(av, { toValue: 10, duration: reducedMotion ? 0 : Motion.baseMs, useNativeDriver: false })
        )
      ).start();
      return;
    }

    Animated.parallel(
      bars.map((h, i) =>
        Animated.timing(animValues[i], {
          toValue: (h / maxH) * height * 0.9 + height * 0.1,
          duration: reducedMotion ? 0 : Motion.baseMs,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [animated, frozen, flatLine, height, reducedMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.container, fill ? styles.containerFill : undefined, { height }]}>
      {animValues.map((animValue, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            fill ? styles.fillBar : styles.fixedBar,
            {
              height: animValue,
              backgroundColor: color,
              opacity: 1,
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
    gap: Spacing.waveformGap,
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 2,
  },
  fixedBar: {
    width: 4,
  },
  fillBar: {
    flex: 1,
    minWidth: 1,
  },
  containerFill: {
    width: '100%',
  },
});
