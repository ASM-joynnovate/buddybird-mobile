import { ActivityIndicator, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ShareIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import useShareSessionFile from '@/screens/report/hooks/use-share-session-file';
import useShareSessionJoinedSound from '@/screens/report/hooks/use-share-session-joined-sound';
import { type LogItem, sharedLogFileName } from '@/screens/report/utils/session-log';
import { track } from '@/services/telemetry/client';
import { colors, font } from '@/theme';

import { logItemMediaTypes } from '@/components/session/session-log-item-head';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Toast } from '@/components/ui/toast';

const sharedFileTypes = { video: 'mp4', image: 'jpg' } as const;

interface Props {
	item: LogItem;
	itemName: string;
	sessionId: string;
}

/**
 * 펼친 기록의 공유 버튼 컴포넌트
 * @param item 기록
 * @param itemName 기록 이름
 * @param sessionId 세션 ID
 */
const SessionLogShareButton = ({ item, itemName, sessionId }: Props) => {
	const { t } = useTranslation();

	const shareSessionFile = useShareSessionFile();
	const shareSessionJoinedSound = useShareSessionJoinedSound();

	const mediaType = logItemMediaTypes[item.kind];
	const uploadedFile = item.file?.status === 'uploaded' ? item.file : null;
	const fileSharing = shareSessionFile.isPending || shareSessionJoinedSound.isPending;
	const shareDisabled = mediaType === 'audio' ? item.sounds.length === 0 : !uploadedFile;
	const foregroundColor = shareDisabled ? colors.subtle : colors.text;

	const handleShare = () => {
		if (fileSharing || shareDisabled) {
			return;
		}

		const fileName = sharedLogFileName(item.startedAt);
		const callbacks = {
			onSuccess: () => {
				if (mediaType === 'audio') {
					track('parrot_sound_shared', { session_id: sessionId });
				}
			},
			onError: () => {
				toast.custom(<Toast variant="error" message={t('report.detail.shareError')} />);
			},
		};

		if (item.kind === 'distressCall') {
			shareSessionJoinedSound.mutate(
				{ urls: item.sounds.map((sound) => sound.audio_file.url), fileName },
				callbacks,
			);
		} else if (mediaType === 'audio') {
			shareSessionFile.mutate({ url: item.sounds[0].audio_file.url, fileName, fileType: 'wav' }, callbacks);
		} else if (uploadedFile) {
			shareSessionFile.mutate(
				{ url: uploadedFile.url, fileName, fileType: sharedFileTypes[mediaType] },
				callbacks,
			);
		}
	};

	return (
		<PressableSurface
			accessibilityLabel={t('report.detail.share', { name: itemName })}
			accessibilityState={{ busy: fileSharing }}
			disabled={shareDisabled || fileSharing}
			onPress={handleShare}
			depth="none"
			faceColor={colors.background}
			edgeColor={colors.background}
			style={styles.button}
			contentStyle={styles.face}
		>
			{fileSharing ? (
				<ActivityIndicator color={colors.muted} />
			) : (
				<ShareIcon size={17} strokeWidth={2.2} color={foregroundColor} />
			)}
			<Copy style={[styles.label, { color: foregroundColor }]}>{t('report.detail.shareButton')}</Copy>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	button: { marginTop: 14, borderRadius: 12 },
	face: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		borderWidth: 0,
		borderRadius: 12,
	},
	label: { fontFamily: font.semiBold, fontSize: 15, lineHeight: 20 },
});

export default SessionLogShareButton;
