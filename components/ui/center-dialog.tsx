import { type ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/app-text';
import { BuddyBirdColors, Layout, Radii, Spacing, Typography } from '@/constants/theme';

// Content 스크롤 영역 기본 상한. 소비처가 prop 으로 재정의할 수 있다.
const DEFAULT_CONTENT_MAX_HEIGHT = 280;

interface CenterDialogProps {
  visible: boolean;
  /** false면 Android 뒤로가기(onRequestClose)로 닫히지 않는다(강제 흐름). 기본 true. */
  dismissable?: boolean;
  onRequestClose?: () => void;
  children: ReactNode;
}

/**
 * 화면 가운데 카드형 다이얼로그의 공용 shell. Modal · 스크림 오버레이 · 카드 프레임 ·
 * dismiss 제어만 담당하고, 내용은 `CenterDialog.Header/Content/Footer` 로 조립한다.
 */
function CenterDialogRoot({ visible, dismissable = true, onRequestClose, children }: CenterDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissable ? onRequestClose : () => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>{children}</View>
      </View>
    </Modal>
  );
}

interface HeaderProps {
  title: string;
  /** 우측 액세서리(예: 버전 라벨). */
  trailing?: ReactNode;
}

function CenterDialogHeader({ title, trailing }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {trailing}
    </View>
  );
}

function CenterDialogContent({
  children,
  maxHeight = DEFAULT_CONTENT_MAX_HEIGHT,
}: {
  children: ReactNode;
  maxHeight?: number;
}) {
  return (
    <ScrollView
      style={{ maxHeight }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

/**
 * 푸터 버튼 영역. 가로 한 줄 배치만 담당하고, 각 버튼의 너비는 호출부가 정한다.
 * 균등 배치는 각 자식을 flex:1 로 감싸고, 비대칭·정렬은 호출부에서 조합한다.
 */
function CenterDialogFooter({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export const CenterDialog = Object.assign(CenterDialogRoot, {
  Header: CenterDialogHeader,
  Content: CenterDialogContent,
  Footer: CenterDialogFooter,
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BuddyBirdColors.scrim,
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: Layout.contentMaxWidth,
    backgroundColor: BuddyBirdColors.surface,
    borderRadius: Radii.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: {
    ...Typography.section,
    color: BuddyBirdColors.ink,
  },
  content: {
    gap: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
