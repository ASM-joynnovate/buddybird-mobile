import { StyleSheet, Text, View } from 'react-native';

interface SessionCycleDotsProps {
  cycle: number;
  totalCycles: number;
  isLearning: boolean;
}

export function SessionCycleDots({ cycle, totalCycles, isLearning }: SessionCycleDotsProps) {
  const page = Math.floor((cycle - 1) / 24);
  const localCycle = (cycle - 1) % 24 + 1;
  const pageDotsCount = Math.min(24, totalCycles - page * 24);
  const overflowCount = totalCycles - (page + 1) * 24;

  return (
    <View style={styles.dots}>
      {Array.from({ length: pageDotsCount }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i < localCycle - 1
                  ? '#A78BFA'
                  : i === localCycle - 1
                  ? isLearning
                    ? '#5EEAD4'
                    : '#FDBA74'
                  : 'rgba(255,255,255,0.15)',
            },
          ]}
        />
      ))}
      {overflowCount > 0 && (
        <Text style={styles.overflow}>+{overflowCount}</Text>
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
