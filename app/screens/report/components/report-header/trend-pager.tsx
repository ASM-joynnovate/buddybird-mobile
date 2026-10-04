import { useEffect, useRef, useState } from 'react';

import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from 'react-native';

import TrendPane from '@/screens/report/components/report-header/trend-pane';
import TrendPaneSkeleton from '@/screens/report/components/report-header/trend-pane-skeleton';
import { useReportStore } from '@/stores/report';
import { periodsBetween } from '@/utils/date';
import { latestStart, shiftedStart } from '@/utils/report-period';

const PRERENDERED_OLDER_PAGE_COUNT = 1;

/** 옆으로 밀어 기간을 넘기는 학습 시간 컴포넌트 */
const TrendPager = () => {
	const listRef = useRef<FlatList<string>>(null);
	const pageDraggedRef = useRef(false);

	const [pageWidth, setPageWidth] = useState(0);
	const [scrubbing, setScrubbing] = useState(false);

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);
	const movePeriod = useReportStore((state) => state.movePeriod);

	const latestPeriodStart = latestStart(period);
	const selectedStart = start ?? latestPeriodStart;
	const periodsAgo = periodsBetween(period, selectedStart, latestPeriodStart);
	const pageStarts = Array.from({ length: periodsAgo + PRERENDERED_OLDER_PAGE_COUNT + 1 }, (_, index) =>
		shiftedStart(period, latestPeriodStart, -index),
	);

	// 화살표 버튼으로 넘긴 스크롤이 끝날 때도 이 이벤트가 오므로, 손으로 끈 넘기기만 반영
	const handleSettlePage = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		if (!pageDraggedRef.current) {
			return;
		}

		pageDraggedRef.current = false;

		const pageIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);

		if (pageIndex !== periodsAgo) {
			movePeriod(periodsAgo - pageIndex);
		}
	};

	/** 화살표 버튼이나 알림으로 기간이 바뀌면 그 기간의 칸으로 넘김 */
	useEffect(() => {
		listRef.current?.scrollToIndex({ index: periodsAgo, animated: true });
	}, [periodsAgo]);

	return (
		<View style={styles.container} onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
			{/*폭을 받기 전에는 같은 높이의 스켈레톤으로 자리 유지*/}
			{pageWidth === 0 && (
				<View style={styles.page}>
					<TrendPaneSkeleton />
				</View>
			)}

			{pageWidth > 0 && (
				<FlatList
					ref={listRef}
					horizontal
					inverted
					pagingEnabled
					disableIntervalMomentum
					scrollEnabled={!scrubbing}
					showsHorizontalScrollIndicator={false}
					data={pageStarts}
					keyExtractor={(pageStart) => pageStart}
					initialScrollIndex={periodsAgo}
					getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
					windowSize={3}
					onScrollBeginDrag={() => {
						pageDraggedRef.current = true;
					}}
					onMomentumScrollEnd={handleSettlePage}
					renderItem={({ item: pageStart }) => (
						<View style={[styles.page, { width: pageWidth }]}>
							<TrendPane
								start={pageStart}
								lineAnimated={pageStart === selectedStart}
								onScrubChange={setScrubbing}
							/>
						</View>
					)}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { marginHorizontal: -24 },
	page: { paddingHorizontal: 24 },
});

export default TrendPager;
