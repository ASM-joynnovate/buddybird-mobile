import { StyleSheet, View } from 'react-native';

import { BuddyBird } from '@/components/mascot/buddy-bird';
import { Text } from '@/components/ui/app-text';
import { CenterDialog } from '@/components/ui/center-dialog';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface FeedbackPromptDialogProps {
  onDismiss: () => void;
  onWriteFeedback: () => void;
}

/**
 * 주기 피드백 팝업. 공용 `CenterDialog` 위에 마스코트 + 메시지를 얹은 얇은 프리젠테이션 컴포넌트.
 * 스토어 평점 요청이 아니라 제품 피드백만 요청한다.
 */
export function FeedbackPromptDialog({ onDismiss, onWriteFeedback }: FeedbackPromptDialogProps) {
  const { t } = useI18n();

  return (
    <CenterDialog visible dismissable onRequestClose={onDismiss}>
      <View style={styles.body}>
        <BuddyBird size={96} animation="float" />
        <Text style={styles.title}>{t('feedback.promptTitle')}</Text>
        <Text style={styles.message}>{t('feedback.promptMessage')}</Text>
      </View>
      <CenterDialog.Footer>
        <View style={styles.footerButton}>
          <PillButton label={t('feedback.promptDismiss')} variant="white" full onPress={onDismiss} />
        </View>
        <View style={styles.footerButton}>
          <PillButton label={t('feedback.promptWrite')} variant="primary" full onPress={onWriteFeedback} />
        </View>
      </CenterDialog.Footer>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  body: {
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
  footerButton: {
    flex: 1,
  },
});
