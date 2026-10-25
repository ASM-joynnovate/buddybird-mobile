import { useRef } from 'react';

import { ActivityIndicator, StyleSheet, type View } from 'react-native';

import { useGetMe } from '@/hooks/apis/users';
import useIsLowPerformance from '@/hooks/use-is-low-performance';

import { useTranslation } from 'react-i18next';

import { BlurTargetView } from 'expo-blur';

import BlockDialog from '@/screens/community/components/block-dialog';
import CommunityFeed from '@/screens/community/components/community-feed';
import CommunityGate from '@/screens/community/components/community-gate';
import CountryScopeChips from '@/screens/community/components/country-scope-chips';
import ReportDialog from '@/screens/community/components/report-dialog';
import { useAuthStore } from '@/stores/auth';
import { useCommunityStore } from '@/stores/community';
import { colors } from '@/theme';

import BuddyRefreshHint from '@/components/buddy-refresh/hint';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { ScreenError } from '@/components/ui/screen-error';
import { Title } from '@/components/ui/title';

/** 국가별 순위 및 피드 목록 컴포넌트 */
const CommunityContent = () => {
	const { t } = useTranslation();

	const blurTargetRef = useRef<View>(null);

	const { data: meData } = useGetMe();

	const isAnonymous = useAuthStore((state) => state.isAnonymous);

	const reportTarget = useCommunityStore((state) => state.reportTarget);
	const blockTarget = useCommunityStore((state) => state.blockTarget);

	const lowPerformance = useIsLowPerformance();

	const gateShown = isAnonymous || !meData.nickname;

	return (
		<>
			<BlurTargetView ref={blurTargetRef} style={styles.container}>
				{!gateShown && <BuddyRefreshHint mascotShown={!lowPerformance} />}

				<Title style={styles.title}>{t('community.title')}</Title>

				<CountryScopeChips />

				<ErrorHandlingWrapper
					fallbackComponent={ScreenError}
					suspenseFallback=<ActivityIndicator color={colors.orange} style={styles.loading} />
				>
					<CommunityFeed />
				</ErrorHandlingWrapper>
			</BlurTargetView>

			{/*익명 및 닉네임 없는 사용자의 입장 팝업*/}
			{gateShown && <CommunityGate blurTarget={blurTargetRef} />}

			{reportTarget && <ReportDialog reportTarget={reportTarget} />}
			{blockTarget && <BlockDialog blockTarget={blockTarget} />}
		</>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	title: { minHeight: 56, paddingHorizontal: 24, paddingTop: 12 },
	loading: { flex: 1 },
});

export default CommunityContent;
