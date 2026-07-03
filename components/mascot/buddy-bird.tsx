import { Image } from 'expo-image';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Motion } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type BuddyBirdAnimation = 'float' | 'bounce' | 'none';

interface BuddyBirdProps {
  size?: number;
  animation?: BuddyBirdAnimation;
}

export function BuddyBird({ size = 120, animation = 'none' }: BuddyBirdProps) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (animation === 'none' || reducedMotion) {
      cancelAnimation(translateY);
      cancelAnimation(rotate);
      translateY.set(0);
      rotate.set(0);
      return;
    }

    const lift = animation === 'bounce' ? -size * 0.08 : -size * 0.05;
    const duration = animation === 'bounce' ? Motion.progressMs * 1.6 : Motion.progressMs * 2;

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
      style={[{ height: size, width: size }, animatedStyle]}>
      <Image
        source={require('@/assets/images/buddy-bird.png')}
        style={{ height: size, width: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
}
