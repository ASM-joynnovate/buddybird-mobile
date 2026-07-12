import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { CenterDialog } from '@/components/ui/center-dialog';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';
import type { UpdatePrompt } from '@/features/app-update/app-update-types';
import { useI18n } from '@/features/i18n/i18n-context';

interface UpdatePromptDialogProps {
  prompt: UpdatePrompt;
  onCancel: () => void;
  onUpdate: () => void;
}

export function UpdatePromptDialog({ prompt, onCancel, onUpdate }: UpdatePromptDialogProps) {
  const { t } = useI18n();
  const isForced = prompt.kind === 'forced';

  return (
    <CenterDialog visible dismissable={!isForced} onRequestClose={onCancel}>
      <CenterDialog.Header
        title={t('appUpdate.title')}
        trailing={
          <Text style={styles.version}>
            {t('appUpdate.versionPrefix')}
            {prompt.latestVersion}
          </Text>
        }
      />

      {prompt.releaseNotes.length > 0 ? (
        <CenterDialog.Content>
          {prompt.releaseNotes.map((note, index) => (
            <View key={`${index}-${note}`} style={styles.noteRow}>
              <Text style={styles.noteIndex}>{index + 1}.</Text>
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </CenterDialog.Content>
      ) : null}

      <CenterDialog.Footer>
        {isForced ? null : (
          <View style={styles.footerButton}>
            <PillButton label={t('appUpdate.cancelButton')} variant="white" full onPress={onCancel} />
          </View>
        )}
        <View style={styles.footerButton}>
          <PillButton label={t('appUpdate.updateButton')} variant="primary" full onPress={onUpdate} />
        </View>
      </CenterDialog.Footer>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  version: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.inkMuted,
  },
  noteRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  noteIndex: {
    ...Typography.body,
    color: BuddyBirdColors.inkMuted,
  },
  noteText: {
    ...Typography.body,
    color: BuddyBirdColors.inkSoft,
    flex: 1,
  },
  footerButton: {
    flex: 1,
  },
});
