import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';

interface MascotReactionProps {
  title: string;
  body?: string;
  mood?: 'coach' | 'celebrate';
  style?: StyleProp<ViewStyle>;
}

export function MascotReaction({ title, body, mood = 'coach', style }: MascotReactionProps) {
  return (
    <View style={[styles.card, mood === 'celebrate' ? styles.celebrate : undefined, style]}>
      <View style={styles.mascotBubble}>
        <Text style={styles.mascot}>🦜</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.primaryDeep,
    borderColor: BuddyBirdColors.primaryPressed,
    borderRadius: Radii.heroCard,
    borderWidth: 2,
    flexDirection: 'row',
    gap: Spacing.cardPaddingSm,
    padding: Spacing.cardPaddingSm,
  },
  celebrate: {
    backgroundColor: BuddyBirdColors.tertiaryDeep,
    borderColor: BuddyBirdColors.tertiaryPressed,
  },
  mascotBubble: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.onDark,
    borderColor: BuddyBirdColors.onDarkSubtle,
    borderRadius: Radii.full,
    borderWidth: 2,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  mascot: {
    fontSize: 32,
  },
  copy: {
    flex: 1,
    gap: Spacing.micro,
  },
  title: {
    ...Typography.body,
    color: BuddyBirdColors.onDark,
  },
  body: {
    ...Typography.caption,
    color: BuddyBirdColors.onDarkMuted,
  },
});
