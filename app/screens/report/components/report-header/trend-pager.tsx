import { useEffect, useRef, useState } from 'react';

import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, StyleSheet, View } from 'react-native';

import ReportHeaderTrendPane from '@/screens/report/components/report-header/trend-pane';
import ReportHeaderTrendPaneSkeleton from '@/screens/report/components/report-header/trend-pane-skeleton';
import { useReportStore } from '@/stores/report';
import { periodsBetween } from '@/utils/date';
import { latestStart, shiftedStart } from '@/utils/report-period';

const PRERENDERED_OLDER_PAGE_COUNT = 1;

/** 옆으로 밀어 기간을 넘기는 학습 시간 컴포넌트 */
const ReportHeaderTrendPager = () => {
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

	/** 기간 변경 시 해당 기간으로 스크롤 */
	useEffect(() => {
		listRef.current?.scrollToIndex({ index: periodsAgo, animated: true });
	}, [periodsAgo]);

	// 손으로 넘긴 경우만 반영
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

	return (
		<View style={styles.container} onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
			{/*폭을 받기 전에는 같은 높이의 스켈레톤으로 자리 유지*/}
			{pageWidth === 0 && (
				<View style={styles.trendPage}>
					<ReportHeaderTrendPaneSkeleton />
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
						<View style={[styles.trendPage, { width: pageWidth }]}>
							<ReportHeaderTrendPane
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
	trendPage: { paddingHorizontal: 24 },
});

export default ReportHeaderTrendPager;
