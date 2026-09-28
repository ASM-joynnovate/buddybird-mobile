import type { ReactElement } from 'react';

import { StyleSheet, View } from 'react-native';

import type { ReportStackParamList } from '@/types/navigation';

import { type RouteProp, useRoute } from '@react-navigation/native';

import ReportContent from '@/screens/report/components/report-content';
import { useReportPeriod } from '@/screens/report/hooks/use-report-period';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportScreen(): ReactElement {
	const route = useRoute<RouteProp<ReportStackParamList, 'Report'>>();

	const period = useReportPeriod(route.params);

	return (
		<Screen scroll={false}>
			<View style={styles.container}>
				{/*리포트와 세션 목록*/}
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton rows={1} height={220} />
				>
					<ReportContent reportPeriod={period} />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
	},
});
