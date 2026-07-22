import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { BuddyBirdColors, Motion, Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { meteringBarLevel, meteringEffectiveLevel } from '@/components/ui/waveform-metering';

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
  // 전달 시 실시간 마이크 metering(0..1|null)에 반응하는 모드로 전환된다(`animated` 무시).
  // null = 녹음 아님(정지 파형 복귀). 미전달(undefined) = 기존 장식 애니메이션 유지.
  metering?: number | null;
}

export function WaveformBars({
  color = BuddyBirdColors.secondary,
  height = 60,
  barCount = 28,
  animated = false,
  frozen = false,
  flatLine = false,
  fill = false,
  metering,
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
  const prevEffectiveRef = useRef(0);

  useEffect(() => {
    // metering 모드: 실제 마이크 입력에 반응 (opt-in via `metering` prop, `animated` 보다 우선)
    if (metering !== undefined) {
      if (metering === null) {
        // 녹음 아님 — 기본 정지 파형으로 복귀
        prevEffectiveRef.current = 0;
        Animated.parallel(
          bars.map((h, i) =>
            Animated.timing(animValues[i], {
              toValue: (h / maxH) * height * 0.9 + height * 0.1,
              duration: reducedMotion ? 0 : Motion.baseMs,
              useNativeDriver: false,
            })
          )
        ).start();
        return;
      }
      const effective = meteringEffectiveLevel(metering);
      const prev = prevEffectiveRef.current;
      prevEffectiveRef.current = effective;
      if (effective === 0) {
        if (prev === 0) return; // 이미 무음 — 애니메이션 불필요
        // 유음 → 무음 전환: 막대를 최소 높이로 한 번만 내림
        Animated.parallel(
          animValues.map((av) =>
            Animated.timing(av, { toValue: height * 0.1, duration: reducedMotion ? 0 : 150, useNativeDriver: false })
          )
        ).start();
        return;
      }
      Animated.parallel(
        animValues.map((av, i) =>
          Animated.timing(av, {
            toValue: meteringBarLevel(effective, i, bars.length) * height * 0.9 + height * 0.1,
            duration: reducedMotion ? 0 : 80,
            useNativeDriver: false,
          })
        )
      ).start();
      return;
    }

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
  }, [animated, frozen, flatLine, height, reducedMotion, metering]); // eslint-disable-line react-hooks/exhaustive-deps

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
