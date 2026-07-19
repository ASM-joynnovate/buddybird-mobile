import { StyleSheet, View } from 'react-native';

import { BuddyBirdColors } from '@/constants/theme';
import type { UseActiveSessionResult } from '@/features/training/hooks/use-active-session';

import { SessionControls } from './session-controls';
import { SessionExitConfirmDialog } from './session-exit-confirm-dialog';
import { SessionHeader } from './session-header';
import { SessionPhaseBadge } from './session-phase-badge';
import { SessionProgressRing } from './session-progress-ring';
import { SessionWaveSection } from './session-wave-section';

interface SessionRunningViewProps {
  session: Pick<
    UseActiveSessionResult,
    | 'isLearning'
    | 'cycle'
    | 'totalCycles'
    | 'phaseProgress'
    | 'currentWord'
    | 'phaseRemaining'
    | 'status'
    | 'togglePause'
    | 'progress'
    | 'audioOn'
  >;
  onStop: () => void;
  isExitConfirmVisible: boolean;
  onExitContinue: () => void;
  insetsTop: number;
  insetsBottom: number;
  fmt: (s: number) => string;
}

export function SessionRunningView({
  session,
  onStop,
  isExitConfirmVisible,
  onExitContinue,
  insetsTop,
  insetsBottom,
  fmt,
}: SessionRunningViewProps) {
  return (
    <View style={[styles.content, { paddingTop: insetsTop }]}>
      <SessionHeader
        progress={session.progress}
        isLearning={session.isLearning}
        onStop={onStop}
      />
      <SessionPhaseBadge cycle={session.cycle} totalCycles={session.totalCycles} />
      <SessionProgressRing
        isLearning={session.isLearning}
        phaseProgress={session.phaseProgress}
        word={session.currentWord}
        timerLabel={fmt(session.phaseRemaining)}
      />
      <SessionWaveSection
        isLearning={session.isLearning}
        isActive={session.status === 'running'}
        audioOn={session.audioOn}
        word={session.currentWord}
      />
      <SessionControls
        status={session.status}
        isLearning={session.isLearning}
        paddingBottom={insetsBottom + 44}
        onToggle={session.togglePause}
      />
      {isExitConfirmVisible ? (
        <SessionExitConfirmDialog onContinue={onExitContinue} onStop={onStop} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: BuddyBirdColors.neutral,
    flex: 1,
  },
});
