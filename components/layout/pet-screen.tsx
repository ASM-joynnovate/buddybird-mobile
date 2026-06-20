import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuddyBirdColors, Layout, Spacing } from '@/constants/theme';

interface PetScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function PetScreen({ children, scroll = true, contentStyle }: PetScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const viewportWidth = Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : width;
  const widthCapStyle = viewportWidth > Layout.contentMaxWidth ? styles.contentWidthCap : undefined;

  if (!scroll) {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={[styles.content, widthCapStyle, { paddingBottom: insets.bottom }, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          widthCapStyle,
          { paddingBottom: Spacing.screenBottomTabs + insets.bottom },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
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
    paddingHorizontal: Spacing.screenXLg,
    paddingTop: Spacing.sectionY,
  },
  contentWidthCap: {
    alignSelf: 'center',
    maxWidth: Layout.contentMaxWidth,
    width: '100%',
  },
});
