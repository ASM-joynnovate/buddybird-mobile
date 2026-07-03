import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { CapturePlaybackController } from '@/features/audio/hooks/use-capture-playback';
import type { FollowAlongCapture } from '@/features/training/follow-along-capture-types';

import { CaptureRow } from './capture-row';

const MAX_TOTAL_MB = 500;

interface SessionCapturesViewProps {
  word: string;
  captures: FollowAlongCapture[] | null;
  playback: CapturePlaybackController;
  onClose: () => void;
}

export function SessionCapturesView({ word, captures, playback, onClose }: SessionCapturesViewProps) {
  const insets = useSafeAreaInsets();
  const totalBytes = (captures ?? []).reduce((sum, capture) => sum + capture.sizeBytes, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>VAD 녹음 디버그</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            &quot;{word}&quot; · {captures ? `${captures.length}개` : '로딩 중'} · {formatMb(totalBytes)} / {MAX_TOTAL_MB}MB
          </Text>
        </View>
        <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={12} onPress={onClose} style={styles.closeButton}>
          <IconSymbol name="xmark" color={BuddyBirdColors.ink} size={22} />
        </Pressable>
      </View>

      {captures === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={BuddyBirdColors.secondary} />
        </View>
      ) : captures.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>이 세션에서 캡처된 녹음이 없습니다</Text>
          <Text style={styles.emptyHint}>따라하기 갭에서 발화가 감지되지 않았어요</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.xxl }]}
          data={captures}
          keyExtractor={(capture) => capture.id}
          renderItem={({ item }) => <CaptureRow capture={item} playback={playback} />}
        />
      )}
    </View>
  );
}

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BuddyBirdColors.neutralDeep,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenX,
    paddingVertical: Spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 22,
  },
  subtitle: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderRadius: Radii.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenX,
  },
  emptyText: {
    color: BuddyBirdColors.inkSoft,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyHint: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenX,
  },
});
