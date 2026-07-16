import { StyleSheet, View } from 'react-native';

import { PillButton } from '@/components/ui/pill-button';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { SessionStatus } from '@/features/training/session-config';

interface SessionControlsProps {
  status: SessionStatus;
  isLearning: boolean;
  paddingBottom: number;
  onToggle: () => void;
}

export function SessionControls({ status, isLearning, paddingBottom, onToggle }: SessionControlsProps) {
  const { t } = useI18n();
  const isRunning = status === 'running';
  const canToggle = isRunning || status === 'paused' || status === 'interrupted';
  const label =
    status === 'starting'
      ? t('sessionActive.preparing')
      : status === 'failed'
        ? t('sessionActive.startFailed')
        : isRunning
          ? t('sessionActive.pause')
          : t('sessionActive.resume');

  return (
    <View style={[styles.controls, { paddingBottom }]}>
      <PillButton
        full
        icon={isRunning ? 'pause.fill' : 'play.fill'}
        label={label}
        onPress={onToggle}
        disabled={!canToggle}
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
});
