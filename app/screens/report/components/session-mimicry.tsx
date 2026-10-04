import { useState } from 'react';

import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { usePrefetchQuery, useSuspenseQuery } from '@tanstack/react-query';

import { getSessionOptions } from '@/hooks/apis/sessions';
import { getWordListOptions } from '@/hooks/apis/words';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import { useTranslation } from 'react-i18next';

import MimicrySoundList from '@/screens/report/components/mimicry-sound-list';

import { EmptyState } from '@/components/ui/empty-state';

interface Props {
	sessionId: string;
}

/**
 * 세션 판정 결과 컴포넌트
 * @param sessionId 세션 ID
 */
const SessionMimicry = ({ sessionId }: Props) => {
	const { t } = useTranslation();

	const [refetchingByUser, setRefetchingByUser] = useState(false);

	usePrefetchQuery(getWordListOptions());

	const { data: sessionData, refetch } = useSuspenseQuery(getSessionOptions({ id: sessionId }));

	useRefreshOnFocus(refetch);

	// 아래로 당겨 새로고침할 때만 로딩 표시
	const handleRefresh = async () => {
		setRefetchingByUser(true);

		try {
			await refetch();
		} finally {
			setRefetchingByUser(false);
		}
	};

	return sessionData.judgment.status === 'done' ? (
		<MimicrySoundList session={sessionData} />
	) : (
		<ScrollView
			refreshControl=<RefreshControl refreshing={refetchingByUser} onRefresh={() => void handleRefresh()} />
			showsVerticalScrollIndicator={false}
			contentContainerStyle={styles.content}
		>
			<EmptyState message={t('report.detail.judging')} />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	content: { flexGrow: 1 },
});

export default SessionMimicry;
