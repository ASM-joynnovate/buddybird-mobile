import { StyleSheet, View } from 'react-native';

import { PillButton } from '@/components/ui/pill-button';

interface WordCreateActionsProps {
  cancelLabel: string;
  saveLabel: string;
  disabled: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function WordCreateActions({
  cancelLabel,
  saveLabel,
  disabled,
  onCancel,
  onSave,
}: WordCreateActionsProps) {
  return (
    <View style={styles.row}>
      <PillButton label={cancelLabel} onPress={onCancel} size="lg" variant="ghost" />
      <PillButton
        disabled={disabled}
        icon="checkmark"
        label={saveLabel}
        onPress={onSave}
        size="lg"
        style={styles.saveButton}
        variant="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
  },
  saveButton: {
    flex: 1,
  },
});
