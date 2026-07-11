import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { CapturePlaybackController } from '@/features/audio/hooks/use-capture-playback';
import type { CaptureSegment } from '@/features/training/follow-along-capture-types';

// 세그먼트 탭 재생 시 앞뒤로 붙이는 문맥 여유. VAD 경계가 발화를 잘랐는지 귀로 판단하기 위함.
// 앞은 실시간 VAD 의 onset 지연(SUSTAIN 3샘플 ≈300ms)만큼 더 붙여 발화 어택이 잘려 들리지 않게 한다.
const SEGMENT_LEAD_MS = 300;
const SEGMENT_TAIL_MS = 200;

interface SegmentTimelineProps {
  captureId: string;
  uri: string;
  segments: CaptureSegment[];
  playback: CapturePlaybackController;
}

// 녹음 metering 파형(peaks)은 저장되지 않으므로 진폭 파형이 아닌 "발화 구간 블록"만 그린다.
// 축 길이는 마지막 발화 끝(maxEndMs) 기준 — 저장된 데이터만으로 알 수 있는 상한이다.
export function SegmentTimeline({ captureId, uri, segments, playback }: SegmentTimelineProps) {
  const axisEndMs = segments.reduce((max, segment) => Math.max(max, segment.endMs), 0) || 1;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {segments.map((segment, index) => {
          const key = segmentKey(captureId, index);
          const left = (segment.startMs / axisEndMs) * 100;
          const width = ((segment.endMs - segment.startMs) / axisEndMs) * 100;
          return (
            <View
              key={key}
              style={[
                styles.block,
                { left: `${left}%`, width: `${width}%` },
                playback.activeKey === key ? styles.blockActive : undefined,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.chips}>
        {segments.map((segment, index) => {
          const key = segmentKey(captureId, index);
          const isActive = playback.activeKey === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => {
                if (isActive) {
                  playback.stop();
                  return;
                }
                void playback.play(key, uri, {
                  startMs: segment.startMs - SEGMENT_LEAD_MS,
                  endMs: segment.endMs + SEGMENT_TAIL_MS,
                });
              }}
              style={[styles.chip, isActive ? styles.chipActive : undefined]}>
              <IconSymbol
                name={isActive ? 'stop.fill' : 'play.fill'}
                color={isActive ? BuddyBirdColors.onPrimary : BuddyBirdColors.secondary}
                size={13}
              />
              <Text style={[styles.chipLabel, isActive ? styles.chipLabelActive : undefined]}>
                {index + 1}. {formatMs(segment.startMs)}–{formatMs(segment.endMs)} ({formatMs(segment.endMs - segment.startMs)})
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function segmentKey(captureId: string, index: number): string {
  return `${captureId}:seg:${index}`;
}

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  track: {
    backgroundColor: BuddyBirdColors.surface2,
    borderRadius: Radii.sm,
    height: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  block: {
    backgroundColor: BuddyBirdColors.secondary,
    borderRadius: 3,
    bottom: 3,
    minWidth: 3,
    position: 'absolute',
    top: 3,
  },
  blockActive: {
    backgroundColor: BuddyBirdColors.primary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.blueTint,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    gap: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  chipActive: {
    backgroundColor: BuddyBirdColors.primary,
  },
  chipLabel: {
    color: BuddyBirdColors.inkSoft,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
  },
  chipLabelActive: {
    color: BuddyBirdColors.onPrimary,
  },
});
