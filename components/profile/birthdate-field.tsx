import { useRef } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BirthDatePicker } from '@/components/profile/birthdate-picker';
import { Chip } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { formatBirthDate } from '@/features/profile/profile-age';

// '모름' 해제 시 채울 기본 생년월일: 약 1살(작년 이번 달 1일).
function defaultBirthDate(): string {
  const now = new Date();
  return formatBirthDate(now.getFullYear() - 1, now.getMonth() + 1, 1);
}

interface BirthDateFieldProps {
  label: string;
  value: string | null; // YYYY-MM-DD, null = 모름
  onChange: (birthDate: string | null) => void;
  error?: string;
  labelStyle?: StyleProp<TextStyle>;
}

// 생년월일 입력 필드: 라벨 행에 '모름' 토글을 두고, 아래에 드럼롤(또는 모름 안내)을 렌더한다.
export function BirthDateField({ label, value, onChange, error, labelStyle }: BirthDateFieldProps) {
  const { t } = useI18n();

  // '모름' 상태에서도 마지막으로 고른(또는 기본) 날짜를 기억했다가 해제 시 복원한다.
  const lastKnownRef = useRef<string | null>(null);
  if (value !== null) {
    lastKnownRef.current = value;
  }
  const isUnknown = value === null;

  function toggleUnknown(): void {
    onChange(isUnknown ? (lastKnownRef.current ?? defaultBirthDate()) : null);
  }

  return (
    <FormField
      label={label}
      labelStyle={labelStyle}
      error={error}
      labelAccessory={
        <Chip active={isUnknown} label={t('common.birthDate.unknown')} onPress={toggleUnknown} tone="sun" />
      }
    >
      {value !== null ? (
        <BirthDatePicker value={value} onChange={onChange} />
      ) : (
        <Text style={styles.hint}>{t('common.birthDate.unknownHint')}</Text>
      )}
    </FormField>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.inkMuted,
    paddingVertical: Spacing.md,
    textAlign: 'center',
  },
});
