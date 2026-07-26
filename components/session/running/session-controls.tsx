import { Linking, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Fonts, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { SessionStatus } from '@/features/training/session-config';
import type { SessionEngineFailure, SessionEngineFailureCode } from '@/modules/session-audio-engine';

// 나머지 code(service-start-not-allowed, audio-engine-failed)는 failureEngine으로 fallback.
const FAILURE_MESSAGE_KEYS: Partial<Record<SessionEngineFailureCode, string>> = {
  'permission-denied': 'sessionActive.failurePermissionDenied',
  'audio-source-unavailable': 'sessionActive.failureAudioSourceUnavailable',
  'audio-route-unavailable': 'sessionActive.failureAudioRouteUnavailable',
  'storage-unavailable': 'sessionActive.failureStorageUnavailable',
};

interface SessionControlsProps {
  status: SessionStatus;
  isLearning: boolean;
  paddingBottom: number;
  onToggle: () => void;
  onRetry: () => void;
  failure: SessionEngineFailure | null;
  failedDuringSession: boolean;
}

export function SessionControls({
  status,
  isLearning,
  paddingBottom,
  onToggle,
  onRetry,
  failure,
  failedDuringSession,
}: SessionControlsProps) {
  const { t } = useI18n();
  const isRunning = status === 'running';
  const isFailed = status === 'failed';
  const canPress = isRunning || status === 'paused' || status === 'interrupted' || isFailed;
  // 권한 거부는 재시도로 풀리지 않는다(엔진만 다시 부름) — 앱 설정으로 보내 사용자가 직접 허용하게 한다.
  const isPermissionDenied = isFailed && failure?.code === 'permission-denied';
  const label = isPermissionDenied
    ? t('sessionActive.openSettings')
    : isFailed
      ? t('sessionActive.retry')
      : status === 'starting'
        ? t('sessionActive.preparing')
        : isRunning
          ? t('sessionActive.pause')
          : t('sessionActive.resume');
  const icon = isPermissionDenied ? 'gearshape.fill' : isRunning ? 'pause.fill' : 'play.fill';
  const onPress = isPermissionDenied
    ? () => {
        void Linking.openSettings();
      }
    : isFailed
      ? onRetry
      : onToggle;

  return (
    <View style={[styles.controls, { paddingBottom }]}>
      {isFailed ? (
        <View style={styles.failureBox} accessibilityRole="alert">
          <Text style={styles.failureTitle}>
            {t(failedDuringSession ? 'sessionActive.sessionFailed' : 'sessionActive.startFailed')}
          </Text>
          <Text style={styles.failureBody}>
            {t((failure && FAILURE_MESSAGE_KEYS[failure.code]) ?? 'sessionActive.failureEngine')}
          </Text>
        </View>
      ) : null}
      <PillButton
        full
        icon={icon}
        label={label}
        onPress={onPress}
        disabled={!canPress}
        size="lg"
        variant={isLearning ? 'primary' : 'blue'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 10,
  },
  failureBox: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  failureTitle: {
    color: BuddyBirdColors.accentRed,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 14,
    fontWeight: '800',
  },
  failureBody: {
    ...Typography.caption,
    color: BuddyBirdColors.inkMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
