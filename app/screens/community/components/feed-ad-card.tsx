import { Image, StyleSheet, View } from 'react-native';

import type { AdClickTarget } from '@/types/apis/ads';
import type { FeedAdItem } from '@/types/apis/feed';

import { useTranslation } from 'react-i18next';

import * as WebBrowser from 'expo-web-browser';
import { ChevronRightIcon } from 'lucide-react-native';

import { reportError } from '@/services/telemetry/client';
import { useAdStore } from '@/stores/ad';
import { colors, font, radius } from '@/theme';

import { Avatar } from '@/components/ui/avatar';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	feedAdItem: FeedAdItem;
	position: number;
	onImageError: () => void;
}

/**
 * 피드 광고 카드 컴포넌트
 * @param feedAdItem 피드 광고 항목
 * @param position 응답 페이지 data 배열 index
 * @param onImageError 사진 로드 실패 시 호출
 */
const FeedAdCard = ({ feedAdItem, position, onImageError }: Props) => {
	const { t } = useTranslation();

	const addAdClick = useAdStore((state) => state.addAdClick);

	const handleOpenAd = (clickTarget: AdClickTarget) => {
		addAdClick(feedAdItem, position, clickTarget);

		void WebBrowser.openBrowserAsync(feedAdItem.link_url).catch((error) => reportError(error, 'ad_link'));
	};

	return (
		<PressableSurface
			accessibilityRole="link"
			accessibilityLabel={feedAdItem.advertiser_name}
			onPress={() => handleOpenAd('background')}
			depth="none"
			contentStyle={styles.card}
		>
			<View style={styles.advertiserRow}>
				<PressableSurface
					accessibilityRole="link"
					accessibilityLabel={feedAdItem.advertiser_name}
					onPress={() => handleOpenAd('profile')}
					variant="plain"
					depth="none"
					cornerRadius="pill"
					contentStyle={styles.plainFace}
				>
					<Avatar uri={feedAdItem.advertiser_photo_file.url} placeholder={null} size="small" />
				</PressableSurface>

				<View style={styles.textContainer}>
					<PressableSurface
						accessibilityRole="link"
						onPress={() => handleOpenAd('profile')}
						variant="plain"
						depth="none"
						cornerRadius="none"
						style={styles.namePressable}
						contentStyle={styles.plainFace}
					>
						<Copy numberOfLines={1} style={styles.name}>
							{feedAdItem.advertiser_name}
						</Copy>
					</PressableSurface>
					{feedAdItem.advertiser_description !== null && (
						<Copy numberOfLines={1} style={styles.description}>
							{feedAdItem.advertiser_description}
						</Copy>
					)}
				</View>

				{feedAdItem.is_ad && (
					<View style={styles.adTag}>
						<Copy style={styles.adTagText}>{t('common.ad')}</Copy>
					</View>
				)}
			</View>

			<Copy style={styles.body}>{feedAdItem.body}</Copy>

			<View style={styles.media}>
				<PressableSurface
					accessibilityRole="link"
					accessibilityLabel={feedAdItem.advertiser_name}
					onPress={() => handleOpenAd('image')}
					variant="plain"
					depth="none"
					cornerRadius="none"
					contentStyle={styles.plainFace}
				>
					<Image
						source={{ uri: feedAdItem.image_file.url }}
						resizeMode="cover"
						accessibilityIgnoresInvertColors
						onError={onImageError}
						style={styles.image}
					/>
				</PressableSurface>
				<PressableSurface
					accessibilityRole="link"
					onPress={() => handleOpenAd('button')}
					depth="none"
					cornerRadius="none"
					faceColor={feedAdItem.button_color}
					contentStyle={styles.button}
				>
					<Copy numberOfLines={1} style={[styles.buttonText, { color: feedAdItem.button_text_color }]}>
						{feedAdItem.button_text}
					</Copy>
					<ChevronRightIcon size={20} color={feedAdItem.button_text_color} />
				</PressableSurface>
			</View>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	card: { paddingHorizontal: 16, paddingTop: 16, overflow: 'hidden' },
	plainFace: { borderWidth: 0 },
	advertiserRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	textContainer: { flex: 1, minWidth: 0 },
	namePressable: { alignSelf: 'flex-start' },
	name: { fontFamily: font.black, fontSize: 15, lineHeight: 20 },
	description: { marginTop: 1, fontFamily: font.extraBold, fontSize: 13, lineHeight: 17, color: colors.subtle },
	adTag: {
		height: 15,
		justifyContent: 'center',
		paddingHorizontal: 4,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: radius.xsmall,
	},
	adTagText: { fontFamily: font.extraBold, fontSize: 10, lineHeight: 12, letterSpacing: 0.4, color: colors.subtle },
	body: { marginTop: 12, fontSize: 16, lineHeight: 24 },
	media: { marginTop: 12, marginHorizontal: -16 },
	image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface },
	button: {
		height: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingLeft: 16,
		paddingRight: 12,
		borderWidth: 0,
	},
	buttonText: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 15 },
});

export default FeedAdCard;
