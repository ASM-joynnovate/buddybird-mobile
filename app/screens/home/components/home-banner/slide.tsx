import { Image, StyleSheet, View } from 'react-native';

import type { BannerAd } from '@/types/apis/ads';

import { useTranslation } from 'react-i18next';

import * as WebBrowser from 'expo-web-browser';

import { reportError } from '@/services/telemetry/client';
import { useAdStore } from '@/stores/ad';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	bannerAd: BannerAd;
	position: number;
	counterVisible: boolean;
	onImageError: () => void;
}

/**
 * 홈 배너 슬라이드 컴포넌트
 * @param bannerAd 배너 광고
 * @param position 캐러셀 슬라이드 index
 * @param counterVisible 순서 표시 여부
 * @param onImageError 이미지 로드 실패 시 호출
 */
const HomeBannerSlide = ({ bannerAd, position, counterVisible, onImageError }: Props) => {
	const { t } = useTranslation();

	const addAdClick = useAdStore((state) => state.addAdClick);

	const handleOpenAd = () => {
		addAdClick({ ad_id: bannerAd.id, serve_id: bannerAd.serve_id, position, click_target: 'image' });

		void WebBrowser.openBrowserAsync(bannerAd.link_url).catch((error) => reportError(error, 'ad_link'));
	};

	return (
		<PressableSurface
			accessibilityRole="link"
			accessibilityLabel={bannerAd.advertiser_name}
			onPress={handleOpenAd}
			variant="plain"
			depth="none"
			cornerRadius="none"
			contentStyle={styles.face}
		>
			<Image
				source={{ uri: bannerAd.image_file.url }}
				resizeMode="cover"
				accessibilityIgnoresInvertColors
				onError={onImageError}
				style={styles.image}
			/>

			{bannerAd.is_ad && (
				<View
					style={[
						styles.adTag,
						counterVisible && styles.adTagBesideCounter,
						{ borderColor: bannerAd.ad_tag_color ?? undefined },
					]}
				>
					<Copy style={[styles.adTagText, { color: bannerAd.ad_tag_color ?? undefined }]}>
						{t('common.ad')}
					</Copy>
				</View>
			)}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	face: { borderWidth: 0 },
	image: { width: '100%', aspectRatio: 3, backgroundColor: colors.surface },
	adTag: {
		position: 'absolute',
		top: 10.5,
		right: 8,
		height: 15,
		justifyContent: 'center',
		paddingHorizontal: 4,
		borderWidth: 1,
		borderRadius: radius.xsmall,
		opacity: 0.55,
	},
	adTagBesideCounter: { right: 52 },
	adTagText: { fontFamily: font.extraBold, fontSize: 10, lineHeight: 12, letterSpacing: 0.4 },
});

export default HomeBannerSlide;
