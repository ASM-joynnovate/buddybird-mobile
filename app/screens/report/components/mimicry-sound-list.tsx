import { FlatList } from 'react-native';

import type { Session } from '@/types/apis/sessions';

import { useSoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/i18n/format';

import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SoundItem } from '@/screens/report/components/sound-item';
import { useSessionMimicry } from '@/screens/report/hooks/use-session-mimicry';
import { useDeviceSettingsStore } from '@/stores/device-settings';

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

	const locale = useDeviceSettingsStore((state) => state.locale);

	const { mimicrySounds, multiDay, refreshing, refresh } = useSessionMimicry(session);

	const player = useSoundPlayer();

	return (
		<FlatList
			data={mimicrySounds}
			keyExtractor={(mimicrySound) => mimicrySound.sound.id}
			renderItem={({ item: mimicrySound }) => (
				<SoundItem
					sound={mimicrySound.sound}
					wordName={mimicrySound.wordName}
					timeLabel={
						multiDay
							? formatDateTime(mimicrySound.sound.captured_at, locale)
							: dayjs(mimicrySound.sound.captured_at).format('LT')
					}
					player={player}
				/>
			)}
			extraData={[player.playingId, player.failedId]}
			refreshing={refreshing}
			onRefresh={refresh}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
			ListEmptyComponent=<EmptyState message={t('report.detail.none')} />
		/>
	);
};

export default MimicrySoundList;
