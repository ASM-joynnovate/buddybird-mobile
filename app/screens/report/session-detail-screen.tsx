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

/** 세션 상세 화면 */
const SessionDetailScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<ReportStackParamList, 'SessionDetail'>>();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	/** 세션 변경 시 session_detail_viewed 이벤트 전송 */
	useEffect(() => {
		track('session_detail_viewed', { session_id: params.sessionId, source: params.source });
	}, [params.sessionId, params.source]);

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ScreenHeader onBack={() => navigation.goBack()} />

				{/*익명 사용자에게는 로그인 안내 표시*/}
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
