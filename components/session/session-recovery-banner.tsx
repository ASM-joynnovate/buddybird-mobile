import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useI18n } from '@/features/i18n/i18n-context';
import { formatDurationMins } from '@/features/shared/duration-format';
import { useTrainingData } from '@/features/training/training-context';

// 앱 실행당 한 번만 복구 이벤트를 계측한다. 컴포넌트 ref가 아니라 모듈 스코프라
// 배너가 unmount/remount(탭 이동)돼도 중복 발화하지 않는다.
let recoveryReported = false;

// 이전 실행에서 중단된 세션이 부분 적립됐을 때 홈에서 알리는 배너.
// 적립·스냅샷 정리는 TrainingDataProvider hydrate가 이미 끝냈고, 여기서는 알림만 한다.
export function SessionRecoveryBanner() {
  const { t } = useI18n();
  const { interruptedSession, dismissInterruptedSession } = useTrainingData();
  const { track } = useAnalytics();

  useEffect(() => {
    if (!interruptedSession || recoveryReported) return;
    recoveryReported = true;
    track({
      name: 'training_session_recovered',
      params: { credited_learning_seconds: interruptedSession.creditedLearningSeconds },
    });
  }, [interruptedSession, track]);

  if (!interruptedSession) return null;

  const creditedMinutes = Math.max(1, Math.round(interruptedSession.creditedLearningSeconds / 60));

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.textColumn}>
        <Text style={styles.title}>{t('sessionRecovery.interruptedTitle')}</Text>
        <Text style={styles.body}>
          {t('sessionRecovery.interruptedBody', {
            word: interruptedSession.word,
            duration: formatDurationMins(creditedMinutes, t),
          })}
        </Text>
      </View>
      <Pressable
        onPress={dismissInterruptedSession}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel={t('sessionRecovery.interruptedActionA11y')}
        hitSlop={8}
      >
        <Text style={styles.dismissLabel}>{t('sessionRecovery.interruptedAction')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: BuddyBirdColors.primarySoft,
    borderRadius: Radii.card,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  textColumn: {
    flex: 1,
    gap: Spacing.xxs,
  },
  title: {
    ...Typography.cardTitle,
    color: BuddyBirdColors.ink,
  },
  body: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.inkSoft,
  },
  dismissButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  dismissLabel: {
    ...Typography.label,
    color: BuddyBirdColors.inkMuted,
  },
});
