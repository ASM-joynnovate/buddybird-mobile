import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SectionKicker } from '@/components/ui/section-kicker';
import { BuddyBirdColors, Radii } from '@/constants/theme';

export type PitchToneChoice = 'original' | 'parrot';

interface FrequencyTuningFormCardProps {
  choice: PitchToneChoice | null;
  onChangeChoice: (c: PitchToneChoice) => void;
}

export function FrequencyTuningFormCard({ choice, onChangeChoice }: FrequencyTuningFormCardProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>단어 음성 톤 설정</SectionKicker>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="원본 녹음 톤 유지"
          accessibilityRole="button"
          accessibilityState={{ selected: choice === 'original' }}
          style={[styles.btn, choice === 'original' && styles.btnActive]}
          onPress={() => onChangeChoice('original')}
        >
          <Text style={[styles.label, choice === 'original' && styles.labelActive]}>원본 녹음 톤 유지</Text>
          <Text style={styles.range}>원본 그대로</Text>
        </Pressable>

        <View style={[styles.btn, styles.btnDisabled]}>
          <View style={styles.comingSoonRow}>
            <Text style={styles.labelDisabled}>앵무새 톤으로 변환</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>추후 서비스 예정</Text>
            </View>
          </View>
          <Text style={styles.range}>발음하기 쉬운 음역대로 변환</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.field,
    borderWidth: 2,
    flex: 1,
    gap: 2,
    minWidth: 90,
    padding: 10,
  },
  btnActive: {
    backgroundColor: BuddyBirdColors.primarySoft,
    borderColor: BuddyBirdColors.primaryShadow,
    borderWidth: 1.5,
  },
  btnDisabled: {
    backgroundColor: BuddyBirdColors.disabledBg,
    borderColor: BuddyBirdColors.borderStrong,
  },
  label: {
    color: BuddyBirdColors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  labelActive: {
    color: BuddyBirdColors.ink,
  },
  labelDisabled: {
    color: BuddyBirdColors.disabledText,
    fontSize: 13,
    fontWeight: '800',
  },
  range: {
    color: BuddyBirdColors.inkMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 2,
  },
  comingSoonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: BuddyBirdColors.surfaceAmberDark,
    borderColor: BuddyBirdColors.tertiaryPressed,
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: BuddyBirdColors.onDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
