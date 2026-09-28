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

export function SessionDetailScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const { params } = useRoute<RouteProp<ReportStackParamList, 'SessionDetail'>>();

	const isAnonymous = useAccountStore((account) => account.isAnonymous);

	useEffect(() => {
		track('session_detail_viewed', { session_id: params.sessionId, source: params.source });
	}, [params.sessionId, params.source]);

	return (
		<Screen scrollable={false}>
			<View style={styles.content}>
				{/*헤더*/}
				<ScreenHeader onBack={() => navigation.goBack()} />

				{/*모사 녹음*/}
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
					<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton rows={4} />>
						<SessionMimicry sessionId={params.sessionId} />
					</ErrorHandlingWrapper>
				)}
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: {
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
