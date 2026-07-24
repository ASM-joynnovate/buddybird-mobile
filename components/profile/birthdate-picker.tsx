import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { WheelPicker } from '@/components/ui/wheel-picker';
import { BuddyBirdColors, Fonts, Radii, withAlpha } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { daysInMonth, formatBirthDate, parseBirthDate } from '@/features/profile/profile-age';

// 연도 선택 범위. 종전 나이 슬라이더 상한(1200개월 = 100년)과 맞춰,
// 역산 back-fill된 레거시 생년도 항상 범위 안에 들도록 한다.
const MAX_AGE_YEARS = 100;
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

interface BirthDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (birthDate: string) => void;
}

// 년/월/일 3컬럼 드럼롤. '모름' 토글·힌트는 상위 `BirthDateField`가 소유한다.
export function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const { t } = useI18n();
  const { year, month, day } = parseBirthDate(value);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: MAX_AGE_YEARS + 1 }, (_, i) => currentYear - MAX_AGE_YEARS + i);
  }, []);
  const dayOptions = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1),
    [year, month]
  );

  function emit(nextYear: number, nextMonth: number, nextDay: number): void {
    // 월/연이 바뀌면 존재하지 않는 일(예: 2월 31일)이 되지 않도록 말일로 클램프한다.
    const clampedDay = Math.min(nextDay, daysInMonth(nextYear, nextMonth));
    onChange(formatBirthDate(nextYear, nextMonth, clampedDay));
  }

  return (
    <View style={styles.frame}>
      <View pointerEvents="none" style={styles.highlight} />
      <View style={styles.row}>
        <View style={styles.group}>
          <WheelPicker
            accessibilityLabel={t('common.birthDate.yearPickerA11y')}
            options={yearOptions}
            selected={year}
            onChange={(next) => emit(next, month, day)}
          />
          <Text style={styles.unit}>{t('common.birthDate.yearUnit')}</Text>
        </View>
        <View style={styles.group}>
          <WheelPicker
            accessibilityLabel={t('common.birthDate.monthPickerA11y')}
            options={MONTH_OPTIONS}
            selected={month}
            onChange={(next) => emit(year, next, day)}
          />
          <Text style={styles.unit}>{t('common.birthDate.monthUnit')}</Text>
        </View>
        <View style={styles.group}>
          <WheelPicker
            accessibilityLabel={t('common.birthDate.dayPickerA11y')}
            options={dayOptions}
            selected={day}
            onChange={(next) => emit(year, month, next)}
          />
          <Text style={styles.unit}>{t('common.birthDate.dayUnit')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
  },
  highlight: {
    backgroundColor: withAlpha(BuddyBirdColors.primary, 0.06),
    borderColor: BuddyBirdColors.primary,
    borderRadius: Radii.iconSquare,
    borderWidth: 2,
    height: 40,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 80,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  group: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 4,
  },
  unit: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
    minWidth: 22,
  },
});
