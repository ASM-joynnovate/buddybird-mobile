import { useEffect } from 'react';

import { StyleSheet, View } from 'react-native';

import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import SessionMimicry from '@/screens/report/components/session-mimicry';
import { track } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { colors, contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 뒤로 가기 버튼과 세션에서 앵무새가 따라 한 소리를 보여 주고 로그인하지 않았으면 로그인 버튼을 보여 주는 화면 */
const SessionDetailScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<ReportStackParamList, 'SessionDetail'>>();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	/** 세션 상세를 열거나 보는 세션이 바뀔 때 session_detail_viewed 전송 */
	useEffect(() => {
		track('session_detail_viewed', { session_id: params.sessionId, source: params.source });
	}, [params.sessionId, params.source]);

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				{/*뒤로 가기 버튼*/}
				<ScreenHeader onBack={() => navigation.goBack()} />

				{/*앵무새가 따라 한 소리 목록이나 로그인 안내*/}
				{isAnonymous ? (
					<View style={styles.signInRequiredContainer}>
						<Copy style={styles.signInRequiredText}>{t('report.signInRequired')}</Copy>
						<Button
							label={t('auth.signIn')}
							variant="secondary"
							onPress={() => navigation.navigate('Login')}
						/>
					</View>
				) : (
					<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton blockCount={4} />>
						<SessionMimicry sessionId={params.sessionId} />
					</ErrorHandlingWrapper>
				)}
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
	signInRequiredText: { color: colors.muted },
	signInRequiredContainer: { gap: 12 },
});

export default SessionDetailScreen;
