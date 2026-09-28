import { RefreshControl, ScrollView } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import { getSessionOptions } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { useIsFocused } from '@react-navigation/native';

import { SCREEN_REFRESH_MS } from '@/config';
import MimicrySoundList from '@/screens/report/components/mimicry-sound-list';

import { EmptyState } from '@/components/ui/empty-state';

interface Props {
	sessionId: string;
}

/**
 * 세션 모사 판정 컴포넌트
 * @param sessionId 세션 ID
 */
const SessionMimicry = ({ sessionId }: Props) => {
	const { t } = useTranslation();

	const focused = useIsFocused();

	const {
		data: sessionData,
		isRefetching,
		refetch,
	} = useSuspenseQuery({
		...getSessionOptions({ id: sessionId }),
		refetchInterval: (query) =>
			focused && query.state.data?.judgment_status === 'pending' ? SCREEN_REFRESH_MS : false,
	});

	return sessionData.judgment_status === 'done' ? (
		<MimicrySoundList session={sessionData} />
	) : (
		<ScrollView
			refreshControl=<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
			showsVerticalScrollIndicator={false}
		>
			<EmptyState message={t('report.detail.judging')} />
		</ScrollView>
	);
};

export default SessionMimicry;
