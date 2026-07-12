import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/ui/app-text';
import { CenterDialog } from '@/components/ui/center-dialog';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import type { FeedbackSubmitStatus } from '@/features/feedback/feedback-context';
import { useI18n } from '@/features/i18n/i18n-context';

// Security Rules 는 2000자 미만을 요구한다. 여유를 두고 입력 자체를 1000자로 제한한다.
const MAX_MESSAGE_LENGTH = 1000;

interface FeedbackFormDialogProps {
  status: FeedbackSubmitStatus;
  onSubmit: (message: string) => void;
  onClose: () => void;
}

/**
 * 자유서술 피드백 폼. 공용 `CenterDialog(avoidKeyboard)` 위에 멀티라인 입력·개인정보 안내·전송을
 * 얹는다. 제출 성공 시 같은 다이얼로그가 "감사합니다" 상태로 전환된다.
 */
export function FeedbackFormDialog({ status, onSubmit, onClose }: FeedbackFormDialogProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');

  const trimmed = message.trim();
  const isSubmitting = status === 'submitting';

  if (status === 'success') {
    return (
      <CenterDialog visible dismissable onRequestClose={onClose}>
        <View style={styles.thanksBody}>
          <Text style={styles.title}>{t('feedback.thanksTitle')}</Text>
          <Text style={styles.message}>{t('feedback.thanksMessage')}</Text>
        </View>
        <CenterDialog.Footer>
          <View style={styles.footerButton}>
            <PillButton label={t('feedback.thanksClose')} variant="primary" full onPress={onClose} />
          </View>
        </CenterDialog.Footer>
      </CenterDialog>
    );
  }

  return (
    <CenterDialog visible avoidKeyboard dismissable={!isSubmitting} onRequestClose={onClose}>
      <CenterDialog.Header title={t('feedback.formTitle')} />
      <View style={styles.formBody}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={t('feedback.formPlaceholder')}
          placeholderTextColor={BuddyBirdColors.inkMuted}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
          editable={!isSubmitting}
          textAlignVertical="top"
        />
        <Text style={styles.notice}>{t('feedback.formPrivacyNotice')}</Text>
        {status === 'error' ? <Text style={styles.error}>{t('feedback.formError')}</Text> : null}
      </View>
      <CenterDialog.Footer>
        <View style={styles.footerButton}>
          <PillButton
            label={t('common.cancel')}
            variant="white"
            full
            disabled={isSubmitting}
            onPress={onClose}
          />
        </View>
        <View style={styles.footerButton}>
          <PillButton
            label={status === 'error' ? t('feedback.formRetry') : t('feedback.formSubmit')}
            variant="primary"
            full
            icon="paperplane.fill"
            disabled={isSubmitting || trimmed.length === 0}
            onPress={() => onSubmit(trimmed)}
          />
        </View>
      </CenterDialog.Footer>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  thanksBody: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.section,
    color: BuddyBirdColors.ink,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: BuddyBirdColors.inkSoft,
    textAlign: 'center',
  },
  formBody: {
    gap: Spacing.sm,
  },
  input: {
    ...Typography.body,
    color: BuddyBirdColors.ink,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.field,
    borderWidth: 1,
    minHeight: 120,
    padding: Spacing.md,
  },
  notice: {
    ...Typography.caption,
    color: BuddyBirdColors.inkMuted,
  },
  error: {
    ...Typography.caption,
    color: BuddyBirdColors.accentCoral,
  },
  footerButton: {
    flex: 1,
  },
});
