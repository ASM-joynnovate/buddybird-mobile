import { type ReactElement, useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import type { ReportStackParamList } from '@/types/navigation';

import { type RouteProp, useRoute } from '@react-navigation/native';

import ReportContent from '@/screens/report/components/report-content';
import { useReportStore } from '@/stores/report';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';

export function ReportScreen(): ReactElement {
	const route = useRoute<RouteProp<ReportStackParamList, 'Report'>>();

	const setPeriodFromParams = useReportStore((state) => state.setPeriodFromParams);

	/** route params의 리포트 기간 반영 */
	useEffect(() => {
		if (route.params) {
			setPeriodFromParams(route.params);
		}
	}, [route.params, setPeriodFromParams]);

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				{/*리포트와 세션 목록*/}
				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<Skeleton rows={1} height={220} />
				>
					<ReportContent />
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
