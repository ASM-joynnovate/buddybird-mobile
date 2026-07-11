import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Layout, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { UpdatePrompt } from '@/features/app-update/app-update-types';

interface UpdatePromptDialogProps {
  prompt: UpdatePrompt;
  onCancel: () => void;
  onUpdate: () => void;
}

export function UpdatePromptDialog({ prompt, onCancel, onUpdate }: UpdatePromptDialogProps) {
  const { t } = useI18n();
  const isForced = prompt.kind === 'forced';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      // 강제 모드에선 Android 뒤로가기(onRequestClose)로 닫히지 않게 no-op.
      onRequestClose={isForced ? () => {} : onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('appUpdate.title')}</Text>
            <Text style={styles.version}>
              {t('appUpdate.versionPrefix')}
              {prompt.latestVersion}
            </Text>
          </View>

          {prompt.releaseNotes.length > 0 ? (
            <ScrollView
              style={styles.notesScroll}
              contentContainerStyle={styles.notes}
              showsVerticalScrollIndicator={false}
            >
              {prompt.releaseNotes.map((note, index) => (
                <View key={`${index}-${note}`} style={styles.noteRow}>
                  <Text style={styles.noteIndex}>{index + 1}.</Text>
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.footer}>
            {isForced ? null : (
              <View style={styles.footerButton}>
                <PillButton
                  label={t('appUpdate.cancelButton')}
                  variant="white"
                  full
                  onPress={onCancel}
                />
              </View>
            )}
            <View style={styles.footerButton}>
              <PillButton
                label={t('appUpdate.updateButton')}
                variant="primary"
                full
                onPress={onUpdate}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BuddyBirdColors.scrim,
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    backgroundColor: BuddyBirdColors.surface,
    borderRadius: Radii.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: {
    ...Typography.section,
    color: BuddyBirdColors.ink,
  },
  version: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.inkMuted,
  },
  notesScroll: {
    maxHeight: 280,
  },
  notes: {
    gap: Spacing.md,
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
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
