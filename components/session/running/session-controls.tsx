import { StyleSheet, View } from 'react-native';

import { PillButton } from '@/components/ui/pill-button';
import { Spacing } from '@/constants/theme';
import type { SessionStatus } from '@/features/training/session-config';

interface SessionControlsProps {
  status: SessionStatus;
  isLearning: boolean;
  paddingBottom: number;
  onToggle: () => void;
}

export function SessionControls({ status, isLearning, paddingBottom, onToggle }: SessionControlsProps) {
  const isRunning = status === 'running';
  const canToggle = isRunning || status === 'paused' || status === 'interrupted';
  const label = status === 'starting' ? '준비 중' : status === 'failed' ? '시작 실패' : isRunning ? '일시정지' : '계속하기';

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
