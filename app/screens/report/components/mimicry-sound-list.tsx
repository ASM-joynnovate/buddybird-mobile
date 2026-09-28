import { FlatList } from 'react-native';

import type { Session } from '@/types/apis/sessions';

import { useGetSessionSoundList } from '@/hooks/apis/sessions';
import { useGetWordList } from '@/hooks/apis/words';
import { useSoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SoundItem } from '@/screens/report/components/sound-item';

import { EmptyState } from '@/components/ui/empty-state';

interface Props {
	session: Session;
}

/**
 * 모사 녹음 목록 컴포넌트
 * @param session 판정이 끝난 세션
 */
const MimicrySoundList = ({ session }: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const {
		data: sessionSoundListData,
		isRefetching: isSessionSoundListRefetching,
		refetch: refetchSessionSoundList,
	} = useGetSessionSoundList({ id: session.id });
	const { data: wordListData, refetch: refetchWordList } = useGetWordList();

	const player = useSoundPlayer();

	const period = session.period;
	const multiDay = period.ended_at ? !dayjs(period.started_at).isSame(period.ended_at, 'day') : false;
	const mimicrySounds = sessionSoundListData
		.filter((sound) => sound.judgment?.word_id)
		.map((sound) => ({
			sound,
			wordName: wordListData.find((word) => word.id === sound.judgment?.word_id)?.name ?? '',
		}));

	/** 소리 목록과 단어 목록 다시 조회 */
	const handleRefresh = () => {
		void refetchSessionSoundList();
		void refetchWordList();
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
			refreshing={isSessionSoundListRefetching}
			onRefresh={handleRefresh}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
			ListEmptyComponent=<EmptyState message={t('report.detail.empty')} />
		/>
	);
};

export default MimicrySoundList;
