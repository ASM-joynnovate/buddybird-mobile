import { useRef } from 'react';

import { ActivityIndicator, StyleSheet, type View } from 'react-native';

import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { BlurTargetView } from 'expo-blur';

import BlockDialog from '@/screens/community/components/block-dialog';
import CommunityFeed from '@/screens/community/components/community-feed';
import CommunityGate from '@/screens/community/components/community-gate';
import CountryScopeChips from '@/screens/community/components/country-scope-chips';
import ReportDialog from '@/screens/community/components/report-dialog';
import { useAccountStore } from '@/stores/account';
import { useCommunityStore } from '@/stores/community';
import { colors } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { ScreenError } from '@/components/ui/screen-error';
import { Title } from '@/components/ui/title';

/** 국가별 순위 및 피드 목록 컴포넌트 */
const CommunityContent = () => {
	const { t } = useTranslation();

	const blurTargetRef = useRef<View>(null);

	const { data: meData } = useGetMe();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	const feedItemToReport = useCommunityStore((state) => state.feedItemToReport);
	const userToBlock = useCommunityStore((state) => state.userToBlock);

	const gateShown = isAnonymous || !meData.nickname;

	return (
		<>
			<BlurTargetView ref={blurTargetRef} style={styles.container}>
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

			{feedItemToReport && <ReportDialog feedItem={feedItemToReport} />}
			{userToBlock && <BlockDialog user={userToBlock} />}
		</>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	title: { minHeight: 56, paddingHorizontal: 24, paddingTop: 12 },
	loading: { flex: 1 },
});

export default CommunityContent;
