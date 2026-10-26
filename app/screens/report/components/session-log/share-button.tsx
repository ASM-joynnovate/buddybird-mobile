import { ActivityIndicator, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ShareIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import useShareSessionFile from '@/screens/report/hooks/use-share-session-file';
import useShareSessionJoinedSound from '@/screens/report/hooks/use-share-session-joined-sound';
import { type LogItem, sharedLogFileName } from '@/screens/report/utils/session-log';
import { track } from '@/services/telemetry/client';
import { colors, depths } from '@/theme';

import { logItemMediaTypes } from '@/components/session/session-log-item-head';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Toast } from '@/components/ui/toast';

const sharedFileTypes = { video: 'mp4', image: 'jpg' } as const;

interface Props {
	logItem: LogItem;
	itemLabel: string;
	sessionId: string;
}

/**
 * 펼친 기록의 공유 버튼 컴포넌트
 * @param logItem 기록
 * @param itemLabel 기록 이름
 * @param sessionId 세션 ID
 */
const SessionLogShareButton = ({ logItem, itemLabel, sessionId }: Props) => {
	const { t } = useTranslation();

	const shareSessionFile = useShareSessionFile();
	const shareSessionJoinedSound = useShareSessionJoinedSound();

	const mediaType = logItemMediaTypes[logItem.kind];
	const uploadedFile = logItem.file?.status === 'uploaded' ? logItem.file : null;
	const fileSharing = shareSessionFile.isPending || shareSessionJoinedSound.isPending;
	const shareDisabled = mediaType === 'audio' ? logItem.sounds.length === 0 : !uploadedFile;
	const shareInactive = shareDisabled || fileSharing;

	const handleShare = () => {
		if (fileSharing || shareDisabled) {
			return;
		}

		const fileName = sharedLogFileName(logItem.startedAt);
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

		if (logItem.kind === 'distressCall') {
			shareSessionJoinedSound.mutate(
				{ urls: logItem.sounds.map((sound) => sound.audio_file.url), fileName },
				callbacks,
			);
		} else if (mediaType === 'audio') {
			shareSessionFile.mutate({ url: logItem.sounds[0].audio_file.url, fileName, fileType: 'wav' }, callbacks);
		} else if (uploadedFile) {
			shareSessionFile.mutate(
				{ url: uploadedFile.url, fileName, fileType: sharedFileTypes[mediaType] },
				callbacks,
			);
		}
	};

	return (
		<PressableSurface
			accessibilityLabel={t('report.detail.share', { name: itemLabel })}
			accessibilityState={{ busy: fileSharing }}
			disabled={shareInactive}
			onPress={handleShare}
			variant={shareInactive ? 'disabled' : 'neutral'}
			depth={shareInactive ? 'none' : 'medium'}
			cornerRadius="control"
			style={shareInactive && styles.inactiveButton}
			contentStyle={styles.face}
		>
			{fileSharing ? (
				<ActivityIndicator color={colors.subtle} />
			) : (
				<ShareIcon size={20} color={shareDisabled ? colors.subtle : colors.text} />
			)}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	inactiveButton: { marginTop: depths.medium },
	face: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
});

export default SessionLogShareButton;
