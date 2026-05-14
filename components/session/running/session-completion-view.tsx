import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SessionCompletionViewProps {
  word: string;
  totalLearningSecondsLabel: string;
  onDismiss: () => void;
}

export function SessionCompletionView({ word, totalLearningSecondsLabel, onDismiss }: SessionCompletionViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>세션 완료!</Text>
      <Text style={styles.word}>{word}</Text>
      <Text style={styles.stat}>모든 사이클 완료</Text>
      <Text style={styles.stat}>총 학습 시간 {totalLearningSecondsLabel}</Text>
      <Pressable style={styles.btn} onPress={onDismiss}>
        <Text style={styles.btnText}>확인</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#A78BFA',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  word: {
    color: '#FAF6F0',
    fontSize: 60,
    fontWeight: '700',
    letterSpacing: -2,
  },
  stat: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: 'rgba(167,139,250,0.20)',
    borderColor: 'rgba(167,139,250,0.45)',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  btnText: {
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '700',
  },
});
