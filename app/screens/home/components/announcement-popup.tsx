import { useEffect, useState } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import type { Announcement } from '@/types/apis/announcements';

import type { RootStackParamList } from '@/types/navigation';

import { useReadAnnouncement } from '@/hooks/apis/announcements';
import { useGetHomeSummary } from '@/hooks/apis/home';

import { useTranslation } from 'react-i18next';

import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import LinkedCopy from '@/screens/home/components/linked-copy';
import { useAnnouncementStore } from '@/stores/announcement';
import { useAppStore } from '@/stores/app';
import { colors, radius } from '@/theme';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { ui } from '@/components/ui/styles';

/** 읽지 않은 공지 팝업 컴포넌트 */
const AnnouncementPopup = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const screenFocused = useIsFocused();

	const { data: homeSummaryData } = useGetHomeSummary();

	const popupClosed = useAnnouncementStore((state) => state.popupClosed);

	const [queue, setQueue] = useState<readonly Announcement[]>(() =>
		popupClosed ? [] : homeSummaryData.unread_announcements,
	);

	const { mutate } = useReadAnnouncement();

	const splashFinished = useAppStore((state) => state.splashFinished);
	const startupOverlayShown = useAppStore((state) => state.startupOverlayShown);
	const updatePromptFinished = useAppStore((state) => state.updatePromptFinished);

	const setPopupClosed = useAnnouncementStore((state) => state.setPopupClosed);

	const announcements = homeSummaryData.unread_announcements;
	const currentAnnouncement =
		queue.find((announcement) => announcements.some(({ id }) => id === announcement.id)) ?? null;
	const image = currentAnnouncement?.images[0];
	const popupVisible =
		splashFinished && !startupOverlayShown && updatePromptFinished && screenFocused && currentAnnouncement !== null;

	/** 남은 공지가 없으면 팝업 닫힘 기록 */
	useEffect(() => {
		if (!currentAnnouncement) {
			setPopupClosed(true);
		}
	}, [currentAnnouncement, setPopupClosed]);

	const handleClose = () => {
		if (!currentAnnouncement) {
			return;
		}

		mutate({ id: currentAnnouncement.id });

		setQueue((prev) => prev.filter((announcement) => announcement.id !== currentAnnouncement.id));
	};

	const handleOpenDetail = () => {
		if (!currentAnnouncement) {
			return;
		}

		handleClose();

		navigation.navigate('AnnouncementDetail', { announcementId: currentAnnouncement.id });
	};

	return (
		<Dialog
			visible={popupVisible}
			title={currentAnnouncement?.title ?? ''}
			onClose={handleClose}
			footer={
				<View style={ui.actionsRow}>
					<Button
						label={t('common.close')}
						variant="secondary"
						size="small"
						depth="high"
						onPress={handleClose}
						style={ui.action}
					/>
					<Button
						label={t('home.announcement.viewDetail')}
						size="small"
						depth="high"
						onPress={handleOpenDetail}
						style={ui.action}
					/>
				</View>
			}
		>
			{image && (
				<Image
					source={{ uri: image.url }}
					style={styles.image}
					resizeMode="cover"
					accessibilityIgnoresInvertColors
				/>
			)}

			{!!currentAnnouncement?.body && <LinkedCopy text={currentAnnouncement.body} numberOfLines={4} />}
		</Dialog>
	);
};

const styles = StyleSheet.create({
	image: {
		width: '100%',
		aspectRatio: 16 / 9,
		borderRadius: radius.control,
		backgroundColor: colors.surface,
	},
});

export default AnnouncementPopup;
