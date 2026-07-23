import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuddyBirdColors, Layout, Spacing } from '@/constants/theme';

interface PetScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  /**
   * true면 스크롤 영역을 `KeyboardAwareScrollView`로 렌더해 키보드가 뜰 때 포커스된
   * 입력칸을 키보드 위로 자동 스크롤한다. `TextInput`을 담는 스크린(예: 프로필 편집)만 켠다.
   * 기본 false — 기존 소비처 동작 불변. `scroll={false}`이면 무시된다.
   */
  avoidKeyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function PetScreen({ children, scroll = true, avoidKeyboard = false, contentStyle }: PetScreenProps) {
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

  const scrollContentStyle = [
    styles.scrollContent,
    widthCapStyle,
    { paddingBottom: Spacing.screenBottomTabs + insets.bottom },
    contentStyle,
  ];

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {avoidKeyboard ? (
        <KeyboardAwareScrollView
          bottomOffset={24}
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}
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
