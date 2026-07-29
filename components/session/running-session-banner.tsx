import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';
import { formatDurationCompact } from '@/features/shared/duration-format';
import { useRunningSessionSnapshot } from '@/features/training/hooks/use-running-session-watcher';
import { deriveSessionCycles } from '@/features/training/session-cycle-model';
import { useTrainingData } from '@/features/training/training-context';
import { sessionAudioEngine } from '@/modules/session-audio-engine';

// 백그라운드에서 도는 세션을 학습 탭에서 알린다.
// 세션 화면에서 뒤로가기 후 "계속 진행"을 고르면 세션이 앱 어디에도 보이지 않은 채 마이크를
// 붙들고 있었다 — 그때 돌아갈 길을 여기서 준다.
export function RunningSessionBanner() {
  const { t } = useI18n();
  const router = useRouter();
  const snapshot = useRunningSessionSnapshot();
  const { pendingSession } = useTrainingData();

  if (!snapshot) return null;

  // 세션 설정이 없으면 화면으로 복귀할 수 없다(session-active는 pendingSession이 있어야 그린다).
  // 이 경우엔 빠져나갈 수단으로 종료만 남긴다.
  const canReopen = pendingSession?.sessionId === snapshot.sessionId;
  const isPaused = snapshot.state === 'paused' || snapshot.state === 'interrupted';
  const word = pendingSession?.word ?? '';

  const { totalCycles, totalSessionSeconds } = deriveSessionCycles({
    totalSeconds: pendingSession?.settings.totalDurationSeconds ?? 0,
    learnSecs: pendingSession?.settings.learningDurationSeconds ?? 0,
    restSecs: pendingSession?.settings.restDurationSeconds ?? 0,
  });
  const remainingSeconds = Math.max(0, totalSessionSeconds - Math.floor(snapshot.elapsedRunningMs / 1000));

  function handleStop(): void {
    sessionAudioEngine.stop().catch((error: unknown) => {
      reportError(error, { scope: 'training.runningSessionBanner.stop' });
    });
  }

  const body = t('sessionBanner.body', {
    cycle: snapshot.cycle,
    total: totalCycles,
    remaining: formatDurationCompact(remainingSeconds, t),
  });

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Pressable
        style={styles.textColumn}
        onPress={canReopen ? () => router.push('/session-active') : undefined}
        disabled={!canReopen}
        accessibilityRole="button"
        accessibilityLabel={t('sessionBanner.openA11y')}
      >
        <Text style={styles.title}>
          {t(isPaused ? 'sessionBanner.pausedTitle' : 'sessionBanner.runningTitle', { word })}
        </Text>
        <Text style={styles.body}>{body}</Text>
      </Pressable>
      <Pressable
        onPress={handleStop}
        style={styles.stopButton}
        accessibilityRole="button"
        accessibilityLabel={t('sessionBanner.stopA11y')}
        hitSlop={8}
      >
        <Text style={styles.stopLabel}>{t('sessionBanner.stopAction')}</Text>
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
  stopButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  stopLabel: {
    ...Typography.label,
    color: BuddyBirdColors.inkMuted,
  },
});
