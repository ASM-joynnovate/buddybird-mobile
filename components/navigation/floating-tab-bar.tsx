import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { LedgeView } from '@/components/ui/ledge-surface';
import { BuddyBirdColors, Depth, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useI18n } from '@/features/i18n/i18n-context';

const TABS = [
  { name: 'index', activeNames: ['index'], labelKey: 'tabs.home', icon: 'dumbbell' as const },
  { name: 'words', activeNames: ['words'], labelKey: 'tabs.words', icon: 'book.fill' as const },
  { name: 'profile', activeNames: ['profile'], labelKey: 'tabs.profile', icon: 'person.fill' as const },
] as const;

function isActiveTab(tab: (typeof TABS)[number], routeName?: string) {
  return routeName ? (tab.activeNames as readonly string[]).includes(routeName) : false;
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const insets = useSafeAreaInsets();
  const activeRouteName = state.routes[state.index]?.name;

  function handleTabPress(targetName: string) {
    if (activeRouteName && targetName !== activeRouteName) {
      track({
        name: 'tab_switched',
        params: { from: activeRouteName, to: targetName },
      });
    }
    navigation.navigate(targetName);
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.xxl + Spacing.xs) }]}>
      {TABS.map((tab) => {
        const active = isActiveTab(tab, activeRouteName);
        const label = t(tab.labelKey);
        const content = (
          <>
            <IconSymbol
              name={tab.icon}
              size={Spacing.xxl}
              color={active ? BuddyBirdColors.onPrimary : BuddyBirdColors.tabIconMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </>
        );

        return (
          <Pressable
            key={tab.name}
            style={styles.tabPressable}
            onPress={() => handleTabPress(tab.name)}
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {active ? (
              <LedgeView depth="selectedCard" baseStyle={styles.activeBase} faceStyle={styles.activeFace}>
                {content}
              </LedgeView>
            ) : (
              <View style={styles.inactiveFace}>{content}</View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'flex-end',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.border,
    borderTopWidth: 2,
    bottom: 0,
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-around',
    left: 0,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    position: 'absolute',
    right: 0,
    zIndex: 30,
  },
  tabPressable: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  activeBase: {
    backgroundColor: BuddyBirdColors.primaryShadow,
    borderRadius: Radii.lg,
  },
  activeFace: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.primary,
    borderRadius: Radii.lg,
    flexDirection: 'column',
    gap: Spacing.xxs,
    justifyContent: 'center',
    paddingHorizontal: Spacing.buttonPaddingMd,
    paddingVertical: Spacing.sm,
  },
  inactiveFace: {
    alignItems: 'center',
    borderRadius: Radii.lg,
    flexDirection: 'column',
    gap: Spacing.xxs,
    justifyContent: 'center',
    marginBottom: Depth.selectedCardOffset,
    paddingHorizontal: Spacing.buttonPaddingMd,
    paddingVertical: Spacing.sm,
  },
  label: {
    color: BuddyBirdColors.tabIconMuted,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
  },
  labelActive: {
    color: BuddyBirdColors.onPrimary,
  },
});
