import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { CenterDialog } from '@/components/ui/center-dialog';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface SessionExitConfirmDialogProps {
  onContinue: () => void;
  onStop: () => void;
}

/**
 * 진행 중인 세션에서 뒤로가기를 눌렀을 때의 종료 확인 다이얼로그.
 * 다이얼로그가 열린 동안의 뒤로가기는 Modal 이 소비해 `onRequestClose` 로 오므로
 * "계속 진행" 과 같게 처리한다.
 */
export function SessionExitConfirmDialog({ onContinue, onStop }: SessionExitConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <CenterDialog visible dismissable onRequestClose={onContinue}>
      <CenterDialog.Header title={t('sessionActive.exitConfirmTitle')} />
      <Text style={styles.message}>{t('sessionActive.exitConfirmBody')}</Text>
      <CenterDialog.Footer>
        <View style={styles.footerButton}>
          <PillButton
            label={t('sessionActive.exitConfirmContinue')}
            variant="white"
            full
            onPress={onContinue}
          />
        </View>
        <View style={styles.footerButton}>
          <PillButton
            label={t('sessionActive.exitConfirmStop')}
            variant="primary"
            full
            onPress={onStop}
          />
        </View>
      </CenterDialog.Footer>
    </CenterDialog>
  );
}

const styles = StyleSheet.create({
  footerButton: {
    flex: 1,
  },
  message: {
    ...Typography.body,
    color: BuddyBirdColors.inkSoft,
  },
});
