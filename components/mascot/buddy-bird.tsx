import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BuddyBirdColors, Motion } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type BuddyBirdAnimation = 'float' | 'bounce' | 'none';

interface BuddyBirdProps {
  size?: number;
  color?: string;
  animation?: BuddyBirdAnimation;
}

export function BuddyBird({
  size = 120,
  color = BuddyBirdColors.primary,
  animation = 'none',
}: BuddyBirdProps) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const bodyWidth = size * 0.82;
  const bodyHeight = size * 0.76;
  const bodyLeft = (size - bodyWidth) / 2;
  const bodyTop = size * 0.16;
  const isLightBody = color === BuddyBirdColors.onDark || color === BuddyBirdColors.surface;
  const faceFill = isLightBody ? BuddyBirdColors.primarySoft : BuddyBirdColors.onDark;

  useEffect(() => {
    if (animation === 'none' || reducedMotion) {
      cancelAnimation(translateY);
      cancelAnimation(rotate);
      translateY.set(0);
      rotate.set(0);
      return;
    }

    const lift = animation === 'bounce' ? -size * 0.08 : -size * 0.05;
    const duration = animation === 'bounce' ? Motion.progressMs : Motion.progressMs * 2;

    translateY.set(
      withRepeat(
        withSequence(withTiming(lift, { duration }), withTiming(0, { duration })),
        -1,
        false
      )
    );
    rotate.set(
      withRepeat(
        withSequence(withTiming(-2, { duration }), withTiming(2, { duration }), withTiming(0, { duration })),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(rotate);
    };
  }, [animation, reducedMotion, rotate, size, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }, { rotate: `${rotate.get()}deg` }],
  }));

  return (
    <Animated.View
      accessibilityRole="image"
      accessibilityLabel="버디 마스코트"
      style={[styles.root, { height: size, width: size }, animatedStyle]}>
      <View
        style={[
          styles.tuft,
          styles.tuftLeft,
          {
            backgroundColor: color,
            borderRadius: size * 0.045,
            height: size * 0.26,
            left: size * 0.42,
            top: size * 0.01,
            width: size * 0.09,
          },
        ]}
      />
      <View
        style={[
          styles.tuft,
          styles.tuftRight,
          {
            backgroundColor: color,
            borderRadius: size * 0.04,
            height: size * 0.22,
            left: size * 0.52,
            top: size * 0.04,
            width: size * 0.08,
          },
        ]}
      />
      <View
        style={[
          styles.body,
          {
            backgroundColor: color,
            borderBottomLeftRadius: bodyWidth * 0.46,
            borderBottomRightRadius: bodyWidth * 0.46,
            borderTopLeftRadius: bodyWidth / 2,
            borderTopRightRadius: bodyWidth / 2,
            height: bodyHeight,
            left: bodyLeft,
            top: bodyTop,
            width: bodyWidth,
          },
        ]}>
        <View
          style={[
            styles.innerShadow,
            {
              backgroundColor: BuddyBirdColors.innerShadowSoft,
              height: size * 0.067,
            },
          ]}
        />
        <View
          style={[
            styles.belly,
            {
              backgroundColor: faceFill,
              borderRadius: size * 0.28,
              height: size * 0.36,
              left: size * 0.19,
              top: size * 0.37,
              width: size * 0.44,
            },
          ]}
        />
        <View
          style={[
            styles.eye,
            {
              backgroundColor: faceFill,
              borderRadius: size * 0.065,
              height: size * 0.13,
              left: size * 0.21,
              top: size * 0.19,
              width: size * 0.13,
            },
          ]}>
          <View
            style={[
              styles.pupil,
              {
                borderRadius: size * 0.028,
                height: size * 0.056,
                width: size * 0.056,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.eye,
            {
              backgroundColor: faceFill,
              borderRadius: size * 0.065,
              height: size * 0.13,
              right: size * 0.21,
              top: size * 0.19,
              width: size * 0.13,
            },
          ]}>
          <View
            style={[
              styles.pupil,
              {
                borderRadius: size * 0.028,
                height: size * 0.056,
                width: size * 0.056,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.beak,
            {
              borderLeftWidth: size * 0.09,
              borderRightWidth: size * 0.09,
              borderTopColor: BuddyBirdColors.accentYellow,
              borderTopWidth: size * 0.12,
              left: size * 0.32,
              top: size * 0.34,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  tuft: {
    position: 'absolute',
    zIndex: 1,
  },
  tuftLeft: {
    transform: [{ rotate: '-12deg' }],
  },
  tuftRight: {
    transform: [{ rotate: '10deg' }],
  },
  body: {
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 2,
  },
  innerShadow: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  belly: {
    position: 'absolute',
  },
  eye: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  pupil: {
    backgroundColor: BuddyBirdColors.ink,
  },
  beak: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
  },
});
