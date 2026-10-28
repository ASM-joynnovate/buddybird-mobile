import { useState } from 'react';

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import type { FeedItem } from '@/types/apis/feed';

import type { RootStackParamList } from '@/types/navigation';

import { useShareToFeed } from '@/hooks/apis/feed';
import { feedKeys } from '@/hooks/apis/keys/feed';
import { useGetParrotListQuery } from '@/hooks/apis/parrots';
import { useGetMeQuery } from '@/hooks/apis/users';
import useSoundPlayer from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { toast } from 'sonner-native';

import type { LogItem } from '@/screens/report/utils/session-log';
import { useCommunityStore } from '@/stores/community';
import { colors } from '@/theme';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import FeedCard from '@/components/feed-card';
import { Copy } from '@/components/ui/copy';
import { dialogToasterId, Toast } from '@/components/ui/toast';

const FEED_LIST_PADDING = 16;

interface Props {
	visible: boolean;
	logItem: LogItem;
	wordName: string;
	onClose: () => void;
}

/**
 * 피드 카드 미리보기 및 공유 확인 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param logItem 공유할 모사 기록
 * @param wordName 세션에서 학습한 단어
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 */
const SessionLogFeedShareDialog = ({ visible, logItem, wordName, onClose }: Props) => {
	const { t } = useTranslation();
	const { width: windowWidth } = useWindowDimensions();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const queryClient = useQueryClient();

	const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });

	const { data: meData } = useGetMeQuery();
	const { data: parrotListData } = useGetParrotListQuery();

	const { isPending, mutate } = useShareToFeed();

	const setCountryScope = useCommunityStore((state) => state.setCountryScope);

	const player = useSoundPlayer();

	const [firstParrot, ...otherParrots] = parrotListData ?? [];
	const feedCardWidth = windowWidth - FEED_LIST_PADDING * 2;
	const previewScale = previewLayout.width / feedCardWidth;
	const shareMessage =
		firstParrot &&
		(otherParrots.length > 0
			? t('report.detail.feedShareConfirmMessageWithOthers', {
					parrot: firstParrot.name,
					count: otherParrots.length,
				})
			: t('report.detail.feedShareConfirmMessage', { parrot: firstParrot.name }));
	const previewFeedItem: FeedItem | null = meData
		? {
				id: logItem.id,
				kind: 'mimic_succeeded',
				created_at: dayjs().toISOString(),
				user: {
					id: meData.id,
					nickname: meData.nickname,
					photo_file: meData.photo_file,
					country: meData.country ?? null,
					parrots: parrotListData ?? [],
				},
				word_name: wordName,
				file: logItem.sounds[0].audio_file,
				threshold: null,
				like_count: 0,
				is_liked: false,
			}
		: null;

	const handleClose = () => {
		player.stop();
		onClose();
	};

	const handleGoToFeed = () => {
		setCountryScope('world');

		void queryClient.invalidateQueries({ queryKey: feedKeys.all() });

		navigation.navigate('Main', { screen: 'CommunityTab', params: { screen: 'Community' } });
	};

	const handleShareToFeed = () => {
		if (isPending) {
			return;
		}

		player.stop();

		mutate(
			{ data: { session_sound_id: logItem.id } },
			{
				onSuccess: () => {
					onClose();

					toast.custom(
						<Toast
							message={t('report.detail.feedShareSucceeded')}
							action={{ label: t('report.detail.goToFeed'), onPress: handleGoToFeed }}
						/>,
					);
				},
				onError: (error) => {
					toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />, {
						toasterId: dialogToasterId,
					});
				},
			},
		);
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('report.detail.feedShareConfirmTitle'),
				confirm: t('report.detail.shareToFeed'),
			}}
			confirmBusy={isPending}
			onConfirm={handleShareToFeed}
			onClose={handleClose}
		>
			{!!shareMessage && <Copy style={styles.message}>{shareMessage}</Copy>}

			{/*피드 카드를 다이얼로그 폭에 맞춰 축소한 미리보기*/}
			{!!previewFeedItem && (
				<View
					style={{ marginBottom: previewLayout.height * (previewScale - 1) }}
					onLayout={(event) => setPreviewLayout(event.nativeEvent.layout)}
				>
					<View style={[styles.preview, { width: feedCardWidth, transform: [{ scale: previewScale }] }]}>
						<FeedCard feedItem={previewFeedItem} player={player} likeDisabled />
					</View>
				</View>
			)}
		</ConfirmDialog>
	);
};

const styles = StyleSheet.create({
	message: { marginBottom: 8, color: colors.muted },
	preview: { transformOrigin: 'top left' },
});

export default SessionLogFeedShareDialog;
