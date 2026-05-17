import { SafeAreaView, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Spacing } from '@/constants/theme';

interface PetScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function PetScreen({ children, scroll = true, contentStyle }: PetScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, contentStyle]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: BuddyBirdColors.neutral,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenXLg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.screenBottomTabs,
    paddingHorizontal: Spacing.screenXLg,
    paddingTop: Spacing.sectionY,
  },
});
