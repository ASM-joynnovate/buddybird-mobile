import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

import { SessionCycleDots } from './session-cycle-dots';

interface SessionControlsProps {
  isRunning: boolean;
  isLearning: boolean;
  cycle: number;
  totalCycles: number;
  paddingBottom: number;
  onToggle: () => void;
}

export function SessionControls({ isRunning, isLearning, cycle, totalCycles, paddingBottom, onToggle }: SessionControlsProps) {
  return (
    <View style={[styles.controls, { paddingBottom }]}>
      <Pressable style={styles.playPauseBtn} onPress={onToggle}>
        <IconSymbol
          name={isRunning ? 'pause.fill' : 'play.fill'}
          style={styles.playPauseIcon}
          color={'rgba(174, 190, 192, 0.8)'}
          size={20}
        />
      </Pressable>
      <SessionCycleDots cycle={cycle} totalCycles={totalCycles} isLearning={isLearning} />
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  playPauseBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  playPauseIcon: {
    color: '#FAF6F0',
    fontSize: 20,
  },
});
