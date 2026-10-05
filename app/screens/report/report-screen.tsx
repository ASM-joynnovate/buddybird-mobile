import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import { getReportOptions } from '@/hooks/apis/reports';

import ReportContent from '@/screens/report/components/report-content';
import ReportSkeleton from '@/screens/report/components/report-skeleton';
import { useReportStore } from '@/stores/report';
import { contentMaxWidth } from '@/theme';
import { latestStart, shiftedStart } from '@/utils/report-period';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';

/** 리포트 화면 */
const ReportScreen = () => {
	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);

	const selectedStart = start ?? latestStart(period);

	usePrefetchQuery(getReportOptions({ period, start: selectedStart }));
	usePrefetchQuery(getReportOptions({ period, start: shiftedStart(period, selectedStart, -1) }));
	usePrefetchQuery(getReportOptions({ period, start: shiftedStart(period, selectedStart, -2) }));

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<ReportSkeleton />>
					<ReportContent />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
	},
});

export default ReportScreen;
