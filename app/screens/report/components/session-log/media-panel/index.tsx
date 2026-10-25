import { Image, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import SessionLogMediaPanelPetcamVideo from '@/screens/report/components/session-log/media-panel/petcam-video';
import SessionLogShareButton from '@/screens/report/components/session-log/share-button';
import type { LogItem } from '@/screens/report/utils/session-log';
import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import { Copy } from '@/components/ui/copy';

interface Props {
	item: LogItem;
	itemName: string;
	mediaType: 'video' | 'image';
	sessionId: string;
}

/**
 * 펫캠 파일 컴포넌트
 * @param item 기록
 * @param itemName 기록 이름
 * @param mediaType 파일 종류
 * @param sessionId 세션 ID
 */
const SessionLogMediaPanel = ({ item, itemName, mediaType, sessionId }: Props) => {
	const { t } = useTranslation();

	const uploadedFile = item.file?.status === 'uploaded' ? item.file : null;

	return (
		<View style={styles.panel}>
			{uploadedFile ? (
				<View style={[styles.media, styles.uploadedMedia]}>
					{mediaType === 'video' ? (
						<SessionLogMediaPanelPetcamVideo url={uploadedFile.url} />
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

			<SessionLogShareButton item={item} itemName={itemName} sessionId={sessionId} />
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
