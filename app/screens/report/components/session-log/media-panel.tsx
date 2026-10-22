import { Image, StyleSheet, View } from 'react-native';

import { useShareSessionFile } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { useVideoPlayer, VideoView } from 'expo-video';

import SessionLogShareButton from '@/screens/report/components/session-log/share-button';
import { useMessageStore } from '@/stores/message';
import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import type { LogItem } from '@/utils/session-log';

import { Copy } from '@/components/ui/copy';

const SHARED_FILE_TIME_FORMAT = 'YYYYMMDD-HHmmss';

interface PetcamVideoProps {
	url: string;
}

/**
 * 펫캠 영상 재생 컴포넌트
 * @param url 영상 주소
 */
const PetcamVideo = ({ url }: PetcamVideoProps) => {
	const player = useVideoPlayer(url);

	return (
		<VideoView
			player={player}
			nativeControls
			contentFit="contain"
			fullscreenOptions={{ enable: true }}
			style={StyleSheet.absoluteFill}
		/>
	);
};

interface Props {
	item: LogItem;
	itemName: string;
	mediaType: 'video' | 'image';
}

/**
 * 펫캠이 찍은 파일을 보이는 컴포넌트
 * @param item 기록
 * @param itemName 기록 이름
 * @param mediaType 파일 종류
 */
const SessionLogMediaPanel = ({ item, itemName, mediaType }: Props) => {
	const { t } = useTranslation();

	const { isPending, mutate } = useShareSessionFile();

	const openPopup = useMessageStore((state) => state.openPopup);

	const uploadedFile = item.file?.status === 'uploaded' ? item.file : null;

	const handleShare = () => {
		if (isPending || !uploadedFile) {
			return;
		}

		mutate(
			{
				url: uploadedFile.url,
				fileName: `buddybird-${dayjs(item.startedAt).format(SHARED_FILE_TIME_FORMAT)}`,
				fileType: mediaType === 'video' ? 'mp4' : 'jpg',
			},
			{ onError: () => openPopup({ title: t('report.detail.shareError') }) },
		);
	};

	return (
		<View style={styles.panel}>
			{uploadedFile ? (
				<View style={[styles.media, styles.uploadedMedia]}>
					{mediaType === 'video' ? (
						<PetcamVideo url={uploadedFile.url} />
					) : (
						<Image
							accessibilityIgnoresInvertColors
							accessibilityLabel={itemName}
							source={{ uri: uploadedFile.url }}
							resizeMode="cover"
							style={StyleSheet.absoluteFill}
						/>
					)}
				</View>
			) : (
				<View style={[styles.media, styles.emptyMedia]}>
					<Copy style={styles.status}>
						{item.file?.status === 'rejected'
							? t('report.detail.fileRejected')
							: t('report.detail.filePending')}
					</Copy>
				</View>
			)}

			<SessionLogShareButton itemName={itemName} disabled={!uploadedFile} onPress={handleShare} />
		</View>
	);
};

const styles = StyleSheet.create({
	panel: { paddingBottom: 18 },
	media: { width: '100%', aspectRatio: 16 / 9, marginTop: 10, overflow: 'hidden', borderRadius: 14 },
	uploadedMedia: { backgroundColor: sessionDetailColors.media },
	emptyMedia: { alignItems: 'center', justifyContent: 'center', backgroundColor: sessionDetailColors.track },
	status: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
});

export default SessionLogMediaPanel;
