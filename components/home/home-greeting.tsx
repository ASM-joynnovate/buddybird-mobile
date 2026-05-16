import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PetHubColors, Radii, Typography } from '@/constants/theme';
import { getDateKicker } from '@/features/profile/profile-display';

interface HomeGreetingProps {
  profileName: string;
}

export function HomeGreeting({ profileName }: HomeGreetingProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.kicker}>{getDateKicker()}</Text>
        <Text style={styles.greeting}>안녕하세요,{'\n'}{profileName}와 함께</Text>
      </View>
      <View style={styles.bellBtn}>
        <IconSymbol name="bell.fill" size={18} color={'rgba(31,58,61,0.5)'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    color: PetHubColors.kickerMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  greeting: {
    ...Typography.homeGreeting,
    color: PetHubColors.primary,
  },
  bellBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
