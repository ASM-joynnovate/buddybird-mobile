import { StyleSheet, View } from 'react-native';

import { PillButton } from '@/components/ui/pill-button';
import { Spacing } from '@/constants/theme';

interface SessionControlsProps {
  isRunning: boolean;
  isLearning: boolean;
  paddingBottom: number;
  onToggle: () => void;
}

export function SessionControls({ isRunning, isLearning, paddingBottom, onToggle }: SessionControlsProps) {
  return (
    <View style={[styles.controls, { paddingBottom }]}>
      <PillButton
        full
        icon={isRunning ? 'pause.fill' : 'play.fill'}
        label={isRunning ? '일시정지' : '계속하기'}
        onPress={onToggle}
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
