import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Fonts, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface WordCreateHeaderProps {
  kicker: string;
  title: string;
  body: string;
  onBack: () => void;
}

export function WordCreateHeader({ kicker, title, body, onBack }: WordCreateHeaderProps) {
  const { t } = useI18n();
  return (
    <>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('wordCreate.backA11y')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={styles.backButton}>
          <IconSymbol color={BuddyBirdColors.inkMuted} name="chevron.left" size={26} />
        </Pressable>
        <Text style={styles.headerKicker}>{kicker}</Text>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{body}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerKicker: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  titleBlock: {
    gap: 4,
    paddingHorizontal: Spacing.xl,
    paddingTop: 8,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.ink,
  },
  subtitle: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 19,
  },
});
