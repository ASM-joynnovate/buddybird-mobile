import { StyleSheet, Text, View } from 'react-native';

interface SessionPhaseBadgeProps {
  isLearning: boolean;
}

export function SessionPhaseBadge({ isLearning }: SessionPhaseBadgeProps) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isLearning ? 'rgba(94,234,212,0.20)' : 'rgba(253,186,116,0.20)',
            borderColor: isLearning ? 'rgba(94,234,212,0.45)' : 'rgba(253,186,116,0.45)',
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: isLearning ? '#5EEAD4' : '#FDBA74' },
          ]}
        />
        <Text style={[styles.text, { color: isLearning ? '#5EEAD4' : '#FDBA74' }]}>
          {isLearning ? '학습 중' : '휴식 중'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    marginTop: 16,
  },
  badge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  dot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
