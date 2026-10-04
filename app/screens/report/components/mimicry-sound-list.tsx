import { ActivityIndicator, FlatList } from 'react-native';

import type { Session } from '@/types/apis/sessions';

import { useGetSessionMimicrySoundList } from '@/hooks/apis/sessions';
import { useGetWordList } from '@/hooks/apis/words';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SoundItem from '@/screens/report/components/sound-item';
import { colors } from '@/theme';

import { EmptyState } from '@/components/ui/empty-state';

interface Props {
	session: Session;
}

/**
 * 앵무새가 따라 한 소리 목록 컴포넌트
 * @param session 판정이 끝난 세션
 */
const MimicrySoundList = ({ session }: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const {
		data: sessionMimicrySoundListData,
		isRefetching: isSessionMimicrySoundListRefetching,
		refetch: refetchSessionMimicrySoundList,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useGetSessionMimicrySoundList({ id: session.id });
	const { data: wordListData, refetch: refetchWordList } = useGetWordList();

	const player = useSoundPlayer();

	const period = session.period;
	const multiDay = period.ended_at ? !dayjs(period.started_at).isSame(period.ended_at, 'day') : false;
	const mimicrySounds = sessionMimicrySoundListData.pages
		.flatMap((soundPage) => soundPage.data)
		.map((sound) => ({
			sound,
			wordName: wordListData.find((word) => word.id === sound.judgment?.word_id)?.name ?? '',
		}));

	const handleRefresh = () => {
		void refetchSessionMimicrySoundList();
		void refetchWordList();
	};

	const handleFetchNextPage = () => {
		if (!hasNextPage || isFetchingNextPage) {
			return;
		}

		void fetchNextPage();
	};

	return (
		<FlatList
			data={mimicrySounds}
			keyExtractor={(mimicrySound) => mimicrySound.sound.id}
			renderItem={({ item: mimicrySound }) => (
				<SoundItem
					sound={mimicrySound.sound}
					wordName={mimicrySound.wordName}
					multiDay={multiDay}
					player={player}
				/>
			)}
			extraData={[player.playingId, player.failedId]}
			refreshing={isSessionMimicrySoundListRefetching}
			onRefresh={handleRefresh}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
			ListEmptyComponent=<EmptyState message={t('report.detail.empty')} />
			onEndReachedThreshold={0.4}
			onEndReached={handleFetchNextPage}
			ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.orange} /> : null}
		/>
	);
};

export default MimicrySoundList;
