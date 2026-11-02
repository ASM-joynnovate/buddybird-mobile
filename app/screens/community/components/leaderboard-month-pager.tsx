import { useEffect, useRef, useState } from 'react';

import {
	ActivityIndicator,
	FlatList,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	StyleSheet,
	View,
} from 'react-native';

import dayjs from 'dayjs';

import LeaderboardRanking from '@/screens/community/components/leaderboard-ranking';
import { leaderboardMonthStart } from '@/screens/community/utils/leaderboard';
import { colors } from '@/theme';
import { localDate, periodsBetween } from '@/utils/date';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { ScreenError } from '@/components/ui/screen-error';

const PRERENDERED_OLDER_PAGE_COUNT = 1;

interface Props {
	start: string;
	onMove: (step: number) => void;
}

/**
 * 스와이프로 달을 이동하는 월별 순위 컴포넌트
 * @param start 표시할 달의 1일 날짜
 * @param onMove 달을 step만큼 이동하는 함수
 */
const LeaderboardMonthPager = ({ start, onMove }: Props) => {
	const listRef = useRef<FlatList<string>>(null);
	const pageDraggedRef = useRef(false);

	const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

	const latestStart = leaderboardMonthStart();
	const monthsAgo = periodsBetween('month', start, latestStart);
	const pageStarts = Array.from({ length: monthsAgo + PRERENDERED_OLDER_PAGE_COUNT + 1 }, (_, index) =>
		localDate(dayjs(latestStart).subtract(index, 'month')),
	);

	/** 달 변경 시 해당 달로 스크롤 */
	useEffect(() => {
		listRef.current?.scrollToIndex({ index: monthsAgo, animated: true });
	}, [monthsAgo]);

	// 드래그로 이동한 경우만 달 변경
	const handleSettlePage = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		if (!pageDraggedRef.current) {
			return;
		}

		pageDraggedRef.current = false;

		const pageIndex = Math.round(event.nativeEvent.contentOffset.x / pageSize.width);

		if (pageIndex !== monthsAgo) {
			onMove(monthsAgo - pageIndex);
		}
	};

	return (
		<View
			style={styles.container}
			onLayout={(event) =>
				setPageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })
			}
		>
			{pageSize.width > 0 && (
				<FlatList
					ref={listRef}
					horizontal
					inverted
					pagingEnabled
					disableIntervalMomentum
					showsHorizontalScrollIndicator={false}
					data={pageStarts}
					keyExtractor={(pageStart) => pageStart}
					initialScrollIndex={monthsAgo}
					getItemLayout={(_, index) => ({ length: pageSize.width, offset: pageSize.width * index, index })}
					windowSize={3}
					onScrollBeginDrag={() => {
						pageDraggedRef.current = true;
					}}
					onMomentumScrollEnd={handleSettlePage}
					renderItem={({ item: pageStart }) => (
						<View style={pageSize}>
							<ErrorHandlingWrapper
								fallbackComponent={ScreenError}
								suspenseFallback=<ActivityIndicator color={colors.orange} style={styles.loading} />
							>
								<LeaderboardRanking period="monthly" start={pageStart} />
							</ErrorHandlingWrapper>
						</View>
					)}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	loading: { flex: 1 },
});

export default LeaderboardMonthPager;
