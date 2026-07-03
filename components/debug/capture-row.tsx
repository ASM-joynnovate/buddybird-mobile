import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { CapturePlaybackController } from '@/features/audio/hooks/use-capture-playback';
import type { FollowAlongCapture } from '@/features/training/follow-along-capture-types';

import { SegmentTimeline } from './segment-timeline';

interface CaptureRowProps {
  capture: FollowAlongCapture;
  playback: CapturePlaybackController;
}

export function CaptureRow({ capture, playback }: CaptureRowProps) {
  const fullKey = `${capture.id}:full`;
  const isPlayingFull = playback.activeKey === fullKey;
  const hasSegments = capture.segments.length > 0;
  const totalSpeechMs = capture.segments.reduce((sum, s) => sum + (s.endMs - s.startMs), 0);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.cycleBadge}>
          <Text style={styles.cycleBadgeText}>{capture.cycle}회차</Text>
        </View>
        <Text style={styles.meta}>{formatClock(capture.capturedAt)}</Text>
        <Text style={styles.meta}>·</Text>
        <Text style={styles.meta}>{formatBytes(capture.sizeBytes)}</Text>
      </View>

      <View style={styles.summaryRow}>
        {hasSegments ? (
          <Text style={styles.summary}>
            발화 {capture.segments.length}구간 · 총 {(totalSpeechMs / 1000).toFixed(1)}s
          </Text>
        ) : (
          <View style={styles.warnBadge}>
            <Text style={styles.warnText}>세그먼트 0 (실시간 감지됐지만 사후 분할 실패)</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (isPlayingFull) {
              playback.stop();
              return;
            }
            void playback.play(fullKey, capture.uri);
          }}
          style={[styles.fullButton, isPlayingFull ? styles.fullButtonActive : undefined]}>
          <IconSymbol
            name={isPlayingFull ? 'stop.fill' : 'play.fill'}
            color={isPlayingFull ? BuddyBirdColors.onPrimary : BuddyBirdColors.ink}
            size={15}
          />
          <Text style={[styles.fullButtonLabel, isPlayingFull ? styles.fullButtonLabelActive : undefined]}>
            전체
          </Text>
        </Pressable>
      </View>

      {hasSegments ? (
        <SegmentTimeline
          captureId={capture.id}
          uri={capture.uri}
          segments={capture.segments}
          playback={playback}
        />
      ) : null}
    </Card>
  );
}

function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--:--';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cycleBadge: {
    backgroundColor: BuddyBirdColors.primarySoft,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  cycleBadgeText: {
    color: BuddyBirdColors.primaryShadow,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 12,
  },
  meta: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  summary: {
    color: BuddyBirdColors.inkSoft,
    flexShrink: 1,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  warnBadge: {
    backgroundColor: BuddyBirdColors.redTint,
    borderRadius: Radii.sm,
    flexShrink: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  warnText: {
    color: BuddyBirdColors.accentRedShadow,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  fullButton: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface2,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  fullButtonActive: {
    backgroundColor: BuddyBirdColors.primary,
  },
  fullButtonLabel: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 13,
  },
  fullButtonLabelActive: {
    color: BuddyBirdColors.onPrimary,
  },
});
