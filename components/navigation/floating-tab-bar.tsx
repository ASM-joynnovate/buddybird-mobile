import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PetHubColors } from '@/constants/theme';

const TABS = [
  { name: 'index', label: '홈', icon: 'house.fill' as const },
  { name: 'session-setup', label: '세션', icon: 'sparkles' as const },
  { name: 'words', label: '단어', icon: 'book.fill' as const },
  { name: 'profile', label: '프로필', icon: 'person.circle' as const },
] as const;

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        {TABS.map((tab) => {
          const active = activeRouteName === tab.name;

          return (
            <Pressable
              key={tab.name}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.iconPill, active && styles.iconPillActive]}>
                <IconSymbol
                  name={tab.icon}
                  size={18}
                  color={active ? PetHubColors.secondary : 'rgba(31,58,61,0.5)'}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    bottom: 0,
    left: 0,
    paddingBottom: 30,
    paddingHorizontal: 12,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: 28,
    borderWidth: 0.5,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 8,
    shadowColor: PetHubColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  iconPill: {
    alignItems: 'center',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 36,
  },
  iconPillActive: {
    backgroundColor: 'rgba(42,157,143,0.14)',
  },
  label: {
    color: 'rgba(31,58,61,0.5)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  labelActive: {
    color: PetHubColors.secondary,
  },
});
