import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { CenterDialog } from '@/components/ui/center-dialog';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface UploadConsentDialogProps {
  onGrant: () => void;
  onDeny: () => void;
}

export function UploadConsentDialog({ onGrant, onDeny }: UploadConsentDialogProps) {
  const { t } = useI18n();

  return (
    <CenterDialog visible dismissable={false}>
      <CenterDialog.Header title={t('uploadConsent.title')} />

      <CenterDialog.Content>
        <Text style={styles.body}>{t('uploadConsent.body')}</Text>
      </CenterDialog.Content>

      <CenterDialog.Footer>
        <View style={styles.footerButton}>
          <PillButton
            label={t('uploadConsent.denyButton')}
            variant="white"
            full
            onPress={onDeny}
            testID="upload-consent-deny"
          />
        </View>
        <View style={styles.footerButton}>
          <PillButton
            label={t('uploadConsent.grantButton')}
            variant="primary"
            full
            onPress={onGrant}
          />
        </View>
      </CenterDialog.Footer>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
    color: BuddyBirdColors.inkSoft,
  },
  footerButton: {
    flex: 1,
  },
});
