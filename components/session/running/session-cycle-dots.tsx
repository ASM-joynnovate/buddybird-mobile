import { StyleSheet, Text, View } from 'react-native';

interface SessionCycleDotsProps {
  cycle: number;
  totalCycles: number;
  isLearning: boolean;
}

export function SessionCycleDots({ cycle, totalCycles, isLearning }: SessionCycleDotsProps) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: Math.min(totalCycles, 24) }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i < cycle - 1
                  ? '#A78BFA'
                  : i === cycle - 1
                  ? isLearning
                    ? '#5EEAD4'
                    : '#FDBA74'
                  : 'rgba(255,255,255,0.15)',
            },
          ]}
        />
      ))}
      {totalCycles > 24 && (
        <Text style={styles.overflow}>+{totalCycles - 24}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
    maxWidth: 180,
  },
  dot: {
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  overflow: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
  },
});
