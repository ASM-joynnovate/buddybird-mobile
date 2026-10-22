import { Image, StyleSheet, View } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { LockIcon } from 'lucide-react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PlayButton } from '@/components/ui/play-button';

const WAVE_BAR_COUNT = 30;

/** 파형 막대 높이 목록 생성 함수 */
const waveBarHeights = (feedItemId: string) => {
	let seed = Number.parseInt(feedItemId.slice(-6), 16);

	return Array.from({ length: WAVE_BAR_COUNT }, (_, index) => {
		seed = (seed * 9301 + 49297) % 233280;

		return 5 + Math.round((seed / 233280) * (index % 6 < 3 ? 22 : 12));
	});
};

interface Props {
	feedItem: FeedItem;
	player: SoundPlayer;
}

/**
 * 따라 한 단어 피드 내용 컴포넌트
 * @param feedItem 피드 항목
 * @param player useSoundPlayer 결과
 */
const FeedCardMimicBody = ({ feedItem, player }: Props) => {
	const { t } = useTranslation();

	const word = feedItem.word_name ?? '';
	const recordingPlaying = player.playingId === feedItem.id;
	const parrotPhotoUrl = feedItem.user.parrots[0]?.photo_file?.url;
	const recordingUrl = feedItem.file?.url;

	return (
		<View style={styles.container}>
			<View style={styles.bubble}>
				<Copy style={styles.label}>{t('community.feed.mimic.label')}</Copy>
				<Copy style={styles.word}>{t('community.feed.mimic.word', { word })}</Copy>

				{recordingUrl ? (
					<View style={styles.playerRow}>
						<View style={styles.waveRow}>
							{waveBarHeights(feedItem.id).map((height, index) => (
								<View key={index} style={[styles.waveBar, { height }]} />
							))}
						</View>
						<PlayButton
							playing={recordingPlaying}
							label={
								recordingPlaying
									? t('common.sound.stopNamed', { name: word })
									: t('community.feed.mimic.play', { word })
							}
							onPress={() => player.toggle(feedItem.id, recordingUrl)}
						/>
					</View>
				) : (
					<View style={styles.privateRow}>
						<LockIcon size={14} color={colors.muted} />
						<Copy style={styles.privateText}>{t('community.feed.mimic.private')}</Copy>
					</View>
				)}

				{/*앵무새 사진을 가리키는 말풍선 꼬리*/}
				<View style={styles.tail} />
			</View>

			{/*첫 번째 앵무새 사진*/}
			<View style={styles.photoContainer}>
				<View style={styles.photoCircle}>
					{!!parrotPhotoUrl && (
						<Image source={{ uri: parrotPhotoUrl }} style={styles.photo} accessibilityIgnoresInvertColors />
					)}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { marginTop: 14, paddingRight: 70 },
	bubble: {
		paddingTop: 12,
		paddingRight: 12,
		paddingBottom: 10,
		paddingLeft: 14,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.surface,
	},
	label: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16, color: colors.muted },
	word: { marginTop: 2, fontFamily: font.black, fontSize: 22, lineHeight: 28 },
	playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
	waveRow: {
		flex: 1,
		minWidth: 0,
		height: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		overflow: 'hidden',
	},
	waveBar: { width: 3, borderRadius: 2, backgroundColor: colors.border },
	privateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
	privateText: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	tail: {
		position: 'absolute',
		right: -6,
		top: '50%',
		width: 14,
		height: 14,
		marginTop: -7,
		borderRadius: 3,
		backgroundColor: colors.surface,
		transform: [{ rotate: '45deg' }],
	},
	photoContainer: {
		position: 'absolute',
		right: -16,
		top: '50%',
		width: 78,
		height: 88,
		marginTop: -44,
		overflow: 'hidden',
	},
	photoCircle: {
		position: 'absolute',
		left: 6,
		top: 0,
		width: 88,
		height: 88,
		borderRadius: 44,
		overflow: 'hidden',
		backgroundColor: colors.surface,
	},
	photo: { width: '100%', height: '100%' },
});

export default FeedCardMimicBody;
