import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { Chip } from '@/components/ui/chip';
import { BuddyBirdColors, Fonts, Spacing } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { getSpeciesGroups } from '@/features/profile/profile-options';

interface SpeciesChipsProps {
  selectedId: string; // 현재 선택된 프리셋 종 id (없으면 '')
  onSelectPreset: (id: string) => void;
}

// 종을 소/중/대 그룹으로 묶어 칩으로 배치한다. '직접 입력' 토글은 상위 FormField 라벨 행이 소유하며,
// 직접 입력 모드에서는 렌더되지 않는다(폼이 입력칸으로 교체). 온보딩·프로필 편집 폼이 공유.
export function SpeciesChips({ selectedId, onSelectPreset }: SpeciesChipsProps) {
  const { locale } = useI18n();
  const groups = getSpeciesGroups(locale);

  return (
    <View style={styles.groups}>
      {groups.map((group) => (
        <View key={group.size} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <View style={styles.chips}>
            {group.options.map((option) => (
              <Chip
                key={option.id}
                active={selectedId === option.id}
                label={option.label}
                onPress={() => onSelectPreset(option.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groups: {
    gap: Spacing.md,
  },
  group: {
    gap: Spacing.xs,
  },
  groupLabel: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
