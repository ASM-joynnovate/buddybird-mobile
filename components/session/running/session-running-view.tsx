import { StyleSheet, View } from 'react-native';

import { BuddyBirdColors } from '@/constants/theme';
import type { UseActiveSessionResult } from '@/features/training/hooks/use-active-session';

import { SessionControls } from './session-controls';
import { SessionHeader } from './session-header';
import { SessionPhaseBadge } from './session-phase-badge';
import { SessionProgressRing } from './session-progress-ring';
import { SessionWaveSection } from './session-wave-section';

interface SessionRunningViewProps {
  session: Pick<
    UseActiveSessionResult,
    'isLearning' | 'sessionMins' | 'cycle' | 'totalCycles' | 'phaseProgress' | 'currentWord' | 'phaseRemaining' | 'status' | 'togglePause'
  >;
  onStop: () => void;
  insetsBottom: number;
  fmt: (s: number) => string;
}

export function SessionRunningView({ session, onStop, insetsBottom, fmt }: SessionRunningViewProps) {
  return (
    <>
      <View
        style={[
          styles.gradientOverlay,
          { backgroundColor: session.isLearning ? BuddyBirdColors.gradientLearning : BuddyBirdColors.gradientRest },
        ]}
      />
      <SessionHeader
        sessionMins={session.sessionMins}
        cycle={session.cycle}
        totalCycles={session.totalCycles}
        onStop={onStop}
      />
      <SessionPhaseBadge isLearning={session.isLearning} />
      <SessionProgressRing
        isLearning={session.isLearning}
        phaseProgress={session.phaseProgress}
        word={session.currentWord}
        timerLabel={fmt(session.phaseRemaining)}
      />
      <SessionWaveSection isLearning={session.isLearning} isActive={session.status === 'running'} />
      <SessionControls
        isRunning={session.status === 'running'}
        isLearning={session.isLearning}
        cycle={session.cycle}
        totalCycles={session.totalCycles}
        paddingBottom={insetsBottom + 16}
        onToggle={session.togglePause}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gradientOverlay: {
    borderRadius: 999,
    height: 300,
    left: '50%',
    marginLeft: -150,
    marginTop: -60,
    position: 'absolute',
    top: 0,
    width: 300,
  },
});
