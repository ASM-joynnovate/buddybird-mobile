import { useState } from 'react';

import { Modal, StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import { getReportOptions } from '@/hooks/apis/reports';
import useIsLowPerformance from '@/hooks/use-is-low-performance';

import { useIsFocused } from '@react-navigation/native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import ReportContent from '@/screens/report/components/report-content';
import ReportGuide from '@/screens/report/components/report-guide';
import ReportSkeleton from '@/screens/report/components/report-skeleton';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { contentMaxWidth } from '@/theme';
import { latestStart, shiftedStart } from '@/utils/report-period';

import BuddyRefreshHint from '@/components/buddy-refresh/hint';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';

/** 리포트 화면 */
const ReportScreen = () => {
	const screenFocused = useIsFocused();

	const [guideVisible, setGuideVisible] = useState(false);

	const period = useReportStore((state) => state.period);
	const start = useReportStore((state) => state.start);
	const reportGuideSeen = useDeviceSettingsStore((state) => state.reportGuideSeen);

	const setReportGuideSeen = useDeviceSettingsStore((state) => state.setReportGuideSeen);

	const selectedStart = start ?? latestStart(period);

	usePrefetchQuery(getReportOptions({ period, start: selectedStart }));
	usePrefetchQuery(getReportOptions({ period, start: shiftedStart(period, selectedStart, -1) }));
	usePrefetchQuery(getReportOptions({ period, start: shiftedStart(period, selectedStart, -2) }));

	const lowPerformance = useIsLowPerformance();

	const handleCloseGuide = () => {
		setReportGuideSeen(true);
		setGuideVisible(false);
	};

	return (
		<Screen scrollable={false}>
			{reportGuideSeen && <BuddyRefreshHint mascotShown={!lowPerformance} />}

			<View style={styles.container}>
				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<ReportSkeleton />>
					<ReportContent onOpenGuide={() => setGuideVisible(true)} />
				</ErrorHandlingWrapper>
			</View>

			{/*예시 리포트로 사용 방법 안내*/}
			<Modal
				statusBarTranslucent
				navigationBarTranslucent
				visible={(!reportGuideSeen || guideVisible) && screenFocused}
				transparent
				animationType="fade"
				onRequestClose={handleCloseGuide}
			>
				<SafeAreaProvider initialMetrics={initialWindowMetrics}>
					<ReportGuide onClose={handleCloseGuide} />
				</SafeAreaProvider>
			</Modal>
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
