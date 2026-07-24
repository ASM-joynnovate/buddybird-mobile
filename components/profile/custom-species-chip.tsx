import { Chip } from '@/components/ui/chip';
import { useI18n } from '@/features/i18n/i18n-context';

interface CustomSpeciesChipProps {
  active: boolean;
  onPress: () => void;
}

// '종' 라벨 행 우측에 배치하는 '직접 입력' 토글 칩. 온보딩·프로필 편집 폼이 공유.
export function CustomSpeciesChip({ active, onPress }: CustomSpeciesChipProps) {
  const { t } = useI18n();
  return (
    <Chip
      active={active}
      label={active ? t('common.selected') : t('common.customInput')}
      onPress={onPress}
      tone="primary"
    />
  );
}
