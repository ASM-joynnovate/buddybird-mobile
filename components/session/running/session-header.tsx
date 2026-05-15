import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PetHubColors } from '@/constants/theme';

interface SessionHeaderProps {
  sessionMins: number;
  cycle: number;
  totalCycles: number;
  onStop: () => void;
}

export function SessionHeader({ sessionMins, cycle, totalCycles, onStop }: SessionHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.mono}>
        {sessionMins}분 세션 · {cycle} / {totalCycles} 사이클
      </Text>
      <Pressable style={styles.stopBtn} onPress={onStop}>
        <Text style={styles.stopBtnText}>중단</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  mono: {
    color: PetHubColors.kickerMutedOnDark,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  stopBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stopBtnText: {
    color: '#FAF6F0',
    fontSize: 12,
    fontWeight: '600',
  },
});
