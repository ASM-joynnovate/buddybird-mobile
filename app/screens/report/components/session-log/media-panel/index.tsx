import { Image, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Galeria } from '@nandorojo/galeria';

import SessionLogMediaPanelPetcamVideo from '@/screens/report/components/session-log/media-panel/petcam-video';
import type { LogItem } from '@/screens/report/utils/session-log';
import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';

import { Copy } from '@/components/ui/copy';

interface Props {
	logItem: LogItem;
	itemLabel: string;
	mediaType: 'video' | 'image';
}

/**
 * 펫캠 파일 컴포넌트
 * @param logItem 기록
 * @param itemLabel 기록 이름
 * @param mediaType 파일 종류
 */
const SessionLogMediaPanel = ({ logItem, itemLabel, mediaType }: Props) => {
	const { t } = useTranslation();

	const uploadedFile = logItem.file?.status === 'uploaded' ? logItem.file : null;

	return (
		<>
			{uploadedFile ? (
				<View style={[styles.media, styles.uploadedMedia]}>
					{mediaType === 'video' ? (
						<SessionLogMediaPanelPetcamVideo url={uploadedFile.url} />
					) : (
						<Galeria urls={[uploadedFile.url]} theme="light">
							<Galeria.Image style={StyleSheet.absoluteFill}>
								<Image
									accessible
									accessibilityRole="imagebutton"
									accessibilityIgnoresInvertColors
									accessibilityLabel={itemLabel}
									source={{ uri: uploadedFile.url }}
									resizeMode="cover"
									style={StyleSheet.absoluteFill}
								/>
							</Galeria.Image>
						</Galeria>
					)}
				</View>
			) : (
				<View style={[styles.media, styles.emptyMedia]}>
					<Copy style={styles.status}>
						{logItem.file?.status === 'rejected'
							? t('report.detail.fileRejected')
							: t('report.detail.filePending')}
					</Copy>
				</View>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	media: { width: '100%', aspectRatio: 16 / 9, marginTop: 10, overflow: 'hidden', borderRadius: 14 },
	uploadedMedia: { backgroundColor: sessionDetailColors.media },
	emptyMedia: { alignItems: 'center', justifyContent: 'center', backgroundColor: sessionDetailColors.track },
	status: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
});

export default SessionLogMediaPanel;
