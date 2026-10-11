import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import SessionDetailContent from '@/screens/report/components/session-detail-content';
import SessionDetailSkeleton from '@/screens/report/components/session-detail-skeleton';
import { track } from '@/services/telemetry/client';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
/** 세션 상세 화면 */
const SessionDetailScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<ReportStackParamList, 'SessionDetail'>>();

	/** 세션 변경 시 session_detail_viewed 이벤트 전송 */
	useEffect(() => {
		track('session_detail_viewed', { session_id: params.sessionId, source: params.source });
	}, [params.sessionId, params.source]);

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ScreenHeader title={t('report.detail.title')} onBack={() => navigation.goBack()} />

				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<SessionDetailSkeleton />>
					<SessionDetailContent sessionId={params.sessionId} />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 20,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
	},
});

export default SessionDetailScreen;
