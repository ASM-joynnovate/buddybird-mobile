import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SplashArtwork } from '@/components/app/splash-artwork';
import { BuddyBirdColors, Motion } from '@/constants/theme';
import { useFeedback } from '@/features/feedback/feedback-context';
import { useProfile } from '@/features/profile/profile-context';
import { useUploadConsent } from '@/features/upload-consent/upload-consent-context';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * in-app 스플래시 오버레이 (Layer 2). 풀스크린으로 앱을 덮어
 * `RootNavigator` 의 hydration 게이팅(ActivityIndicator) 구간을 가린 뒤,
 * 앱이 준비되면(`isHydrated`) 페이드아웃하고 언마운트한다.
 */
export function AppSplashGate() {
  const { isHydrated } = useProfile();
  const { evaluateActiveDay } = useFeedback();
  const { markSplashDone } = useUploadConsent();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [firstBlinkDone, setFirstBlinkDone] = useState(false);
  const opacity = useSharedValue(1);
  const evaluatedRef = useRef(false);

  const handleFirstBlink = useCallback(() => setFirstBlinkDone(true), []);

  // 오버레이가 페인트된 직후 네이티브 스플래시를 숨겨 인계 (갭/깜빡임 없음)
  const handleLayout = () => {
    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.warn('[splash.hide]', error);
    });
  };

  useEffect(() => {
    // 로드 완료(isHydrated) + 첫 눈 깜빡임이 끝날 때까지 스플래시 유지
    if (!isHydrated || !firstBlinkDone) {
      return;
    }

    if (reducedMotion) {
      setVisible(false);
      return;
    }

    opacity.set(
      withTiming(0, { duration: Motion.baseMs }, (finished) => {
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })
    );
  }, [isHydrated, firstBlinkDone, opacity, reducedMotion]);

  // 스플래시 오버레이가 사라져 홈 화면이 처음 보이는 순간(visible→false) 딱 한 번,
  // 수집 동의 팝업 게이트를 열고, cold start 접속일을 반영해 피드백 팝업 조건을 확인한다.
  // 팝업은 네이티브 Modal 이라 이 JS 오버레이 위에 그려지므로 해제 전에는 어떤 팝업도 못 뜬다.
  // reduced-motion 즉시 해제와 페이드아웃 완료 두 경로 모두 visible 전환으로 수렴한다.
  useEffect(() => {
    if (visible || evaluatedRef.current) return;
    evaluatedRef.current = true;
    markSplashDone();
    evaluateActiveDay();
  }, [visible, evaluateActiveDay, markSplashDone]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFill, styles.overlay, animatedStyle]}>
      <SplashArtwork onFirstBlink={handleFirstBlink} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: BuddyBirdColors.splashRed,
  },
});
