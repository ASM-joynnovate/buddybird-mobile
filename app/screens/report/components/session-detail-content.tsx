import { useCallback, useEffect, useMemo, useState } from 'react';

import { Share, StyleSheet, View } from 'react-native';

import { useQueryClient, useSuspenseQueries } from '@tanstack/react-query';

import type { SessionEvent } from '@/types/apis/sessions';

import { apiKeys } from '@/hooks/apis/keys';
import {
	getSessionEventListOptions,
	useGetSession,
	useGetSessionSoundList,
	useGetSessionSummary,
} from '@/hooks/apis/sessions';
import { useGetWordList } from '@/hooks/apis/words';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import Animated, {
	useAnimatedReaction,
	useAnimatedRef,
	useDerivedValue,
	useScrollOffset,
	useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import Recorder, { type LayoutRect, type RecorderParts } from '@/screens/report/components/recorder';
import RecorderPinned from '@/screens/report/components/recorder/pinned';
import SessionOverview from '@/screens/report/components/session-overview';
import TapeLog, { type TapeSelectionSource } from '@/screens/report/components/tape-log';
import { shouldShowEmergencyAudioEvent } from '@/services/remote-config/client';
import { reportError, track } from '@/services/telemetry/client';
import { useMessageStore } from '@/stores/message';
import { getTapeItems, type SoundKind, type TapeItem } from '@/utils/tape-log';

const NO_EVENTS: SessionEvent[] = [];
const LANES_WITH_EMERGENCY: SoundKind[] = ['parrot', 'mimic', 'emergency'];
const LANES_WITHOUT_EMERGENCY: SoundKind[] = ['parrot', 'mimic'];
const DECK_FEED_FULL_RADIUS = 34;
const DECK_TAKE_EMPTY_RADIUS = 18;
const DECK_WOUND_RADIUS = 16;

interface TapeSelection {
	itemId: string;
	selectedBy: TapeSelectionSource;
}

interface Props {
	sessionId: string;
}

/**
 * 세션에서 감지한 소리를 살펴보는 컴포넌트
 * @param sessionId 세션 ID
 */
const SessionDetailContent = ({ sessionId }: Props) => {
	const { t } = useTranslation();

	const queryClient = useQueryClient();

	const emergencyShown = shouldShowEmergencyAudioEvent();

	const { data: sessionData } = useGetSession({ id: sessionId });
	const { data: sessionSummaryData } = useGetSessionSummary({ id: sessionId });
	const {
		data: sessionSoundListData,
		hasNextPage,
		isFetchingNextPage,
		isFetchNextPageError,
		fetchNextPage,
	} = useGetSessionSoundList({ id: sessionId });
	const { data: wordListData } = useGetWordList();
	const sessionEventListQuery = useSuspenseQueries({
		queries: [getSessionEventListOptions({ id: sessionId })].filter(() => emergencyShown),
	}).at(0);

	const player = useSoundPlayer();

	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const scrollY = useScrollOffset(scrollRef);
	const viewportWidth = useSharedValue(0);
	const viewportHeight = useSharedValue(0);
	const contentHeight = useSharedValue(0);
	const deckLayout = useSharedValue<LayoutRect>({ x: 0, y: 0, width: 0, height: 0 });
	const deckParts = useSharedValue<RecorderParts | null>(null);

	const [selection, setSelection] = useState<TapeSelection | null>(null);
	const [pinned, setPinned] = useState(false);

	const openPopup = useMessageStore((state) => state.openPopup);

	const sessionEvents = sessionEventListQuery?.data ?? NO_EVENTS;
	const items = useMemo(
		() =>
			getTapeItems(
				sessionSoundListData.pages.flatMap((soundPage) => soundPage.data),
				sessionEvents,
			),
		[sessionEvents, sessionSoundListData],
	);
	const recording = wordListData.find((word) => word.id === sessionData.word.id)?.recordings.at(0) ?? null;
	const latestItem =
		items.filter((item) => item.kind === 'mimic').at(-1) ??
		items.filter((item) => item.kind === 'parrot').at(-1) ??
		null;
	const selectedItem = items.find((item) => item.id === selection?.itemId) ?? latestItem;
	const selectedIndex = selectedItem ? items.indexOf(selectedItem) : -1;
	const playing = player.playingId !== null && player.playingId === (selectedItem?.id ?? recording?.id);
	const playDisabled = selectedItem ? selectedItem.sounds.length === 0 : recording === null;
	const pageProgress = useDerivedValue(() =>
		Math.min(Math.max(scrollY.get() / Math.max(contentHeight.get() - viewportHeight.get(), 1), 0), 1),
	);
	const deckFeedRadius = useDerivedValue(() => DECK_FEED_FULL_RADIUS - DECK_WOUND_RADIUS * pageProgress.get());
	const deckTakeRadius = useDerivedValue(() => DECK_TAKE_EMPTY_RADIUS + DECK_WOUND_RADIUS * pageProgress.get());

	const refetchSessionDetail = useCallback(
		() => queryClient.invalidateQueries({ queryKey: apiKeys.sessions.detail(sessionId) }),
		[queryClient, sessionId],
	);

	useRefreshOnFocus(refetchSessionDetail);

	/** 소리 목록의 다음 쪽이 있으면 끝까지 이어서 조회 */
	useEffect(() => {
		if (!hasNextPage || isFetchingNextPage || isFetchNextPageError) {
			return;
		}

		void fetchNextPage();
	}, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage]);

	/** 녹음기가 화면 위에 닿으면 고정 */
	useAnimatedReaction(
		() => deckLayout.get().height > 0 && scrollY.get() > deckLayout.get().y,
		(nextPinned, previousPinned) => {
			if (nextPinned !== previousPinned) {
				scheduleOnRN(setPinned, nextPinned);
			}
		},
	);

	/** 알약의 소리를 재생하거나 멈추는 함수 */
	const toggleItem = (item: TapeItem) => {
		if (player.playingId !== item.id) {
			track('parrot_sound_played', { session_id: sessionId });
		}

		player.toggle(item.id, ...item.sounds.map((sound) => sound.audio_file.url));
	};

	const handleTogglePlay = () => {
		if (selectedItem) {
			toggleItem(selectedItem);
		} else if (recording) {
			player.toggle(recording.id, recording.audio_file.url);
		}
	};

	const handlePressItem = (item: TapeItem) => {
		if (item === selectedItem) {
			handleTogglePlay();

			return;
		}

		setSelection({ itemId: item.id, selectedBy: 'item' });

		if (item.sounds.length > 0) {
			toggleItem(item);
		}
	};

	const handleMoveItem = (step: number) => {
		const movedIndex = selectedIndex + step;

		if (selectedIndex === -1 || movedIndex < 0 || movedIndex >= items.length) {
			return;
		}

		const movedItem = items[movedIndex];

		setSelection({ itemId: movedItem.id, selectedBy: 'key' });

		if (movedItem.sounds.length > 0) {
			toggleItem(movedItem);
		}
	};

	const handleShareItem = async (item: TapeItem) => {
		const url = item.sounds[0].audio_file.url;

		try {
			const shareResult = await Share.share({ url, message: url });

			if (shareResult.action === Share.sharedAction) {
				track('parrot_sound_shared', { session_id: sessionId });
			}
		} catch (e) {
			reportError(e, 'parrot_sound_share');

			openPopup({ title: t('report.detail.shareError') });
		}
	};

	const recorderProps = {
		item: selectedItem,
		playing,
		pinned,
		previousDisabled: selectedIndex <= 0,
		nextDisabled: selectedIndex === -1 || selectedIndex === items.length - 1,
		playDisabled,
		onPrevious: () => handleMoveItem(-1),
		onTogglePlay: handleTogglePlay,
		onNext: () => handleMoveItem(1),
		scrollY,
		feedRadius: deckFeedRadius,
		takeRadius: deckTakeRadius,
		deckLayout,
		deckParts,
	};

	return (
		<View
			style={styles.viewport}
			onLayout={(event) => {
				viewportWidth.set(event.nativeEvent.layout.width);
				viewportHeight.set(event.nativeEvent.layout.height);
			}}
		>
			<Animated.ScrollView
				ref={scrollRef}
				showsVerticalScrollIndicator={false}
				scrollEventThrottle={16}
				contentContainerStyle={styles.content}
				onContentSizeChange={(_, height) => contentHeight.set(height)}
			>
				<SessionOverview session={sessionData} sessionSummary={sessionSummaryData} />

				<Recorder {...recorderProps} />

				<TapeLog
					session={sessionData}
					items={items}
					lanes={emergencyShown ? LANES_WITH_EMERGENCY : LANES_WITHOUT_EMERGENCY}
					selectedItem={selectedItem}
					selectedBy={selection?.selectedBy ?? null}
					playing={playing}
					wordName={sessionSummaryData.word.name}
					scrollRef={scrollRef}
					scrollY={scrollY}
					viewportHeight={viewportHeight}
					onPressItem={handlePressItem}
					onTogglePlay={handleTogglePlay}
					onShareItem={(item) => void handleShareItem(item)}
				/>
			</Animated.ScrollView>

			<RecorderPinned {...recorderProps} viewportWidth={viewportWidth} />
		</View>
	);
};

const styles = StyleSheet.create({
	viewport: { flex: 1, marginHorizontal: -24 },
	content: { paddingTop: 8, paddingHorizontal: 24, paddingBottom: 16 },
});

export default SessionDetailContent;
