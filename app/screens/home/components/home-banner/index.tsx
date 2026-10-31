import { useEffect, useState } from 'react';

import { AppState, StyleSheet, View } from 'react-native';

import { useGetAdListQuery } from '@/hooks/apis/ads';

import { useIsFocused } from '@react-navigation/native';
import { useReducedMotion } from 'react-native-reanimated';
import { Carousel } from 'react-native-reanimated-carousel';

import { AD_AUTO_SLIDE_MS } from '@/config/policy';
import HomeBannerSlide from '@/screens/home/components/home-banner/slide';
import { useAdStore } from '@/stores/ad';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

/** 홈 배너 광고 캐러셀 컴포넌트 */
const HomeBanner = () => {
	const screenFocused = useIsFocused();
	const motionReduced = useReducedMotion();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [failedServeIds, setFailedServeIds] = useState<string[]>([]);
	const [appActive, setAppActive] = useState(AppState.currentState === 'active');

	const { data: bannerAdListData } = useGetAdListQuery({ kind: 'home_banner' });

	const addAdImpression = useAdStore((state) => state.addAdImpression);

	const bannerAds = (bannerAdListData ?? []).filter((bannerAd) => !failedServeIds.includes(bannerAd.serve_id));
	const currentBannerIndex = Math.min(currentIndex, bannerAds.length - 1);
	const currentBannerAd = bannerAds[currentBannerIndex];
	const canSlide = bannerAds.length > 1;

	/** 앱의 foreground 여부 변경 */
	useEffect(() => {
		const appStateSubscription = AppState.addEventListener('change', (appState) =>
			setAppActive(appState === 'active'),
		);

		return () => appStateSubscription.remove();
	}, []);

	/** 현재 배너 노출 기록 */
	useEffect(() => {
		if (currentBannerAd && screenFocused && appActive) {
			addAdImpression({
				ad_id: currentBannerAd.id,
				serve_id: currentBannerAd.serve_id,
				position: currentBannerIndex,
			});
		}
	}, [currentBannerAd, currentBannerIndex, screenFocused, appActive, addAdImpression]);

	if (!currentBannerAd) {
		return null;
	}

	return (
		<View style={styles.container}>
			<Carousel
				data={bannerAds}
				keyExtractor={(bannerAd) => bannerAd.serve_id}
				renderItem={({ item: bannerAd, index }) => (
					<HomeBannerSlide
						bannerAd={bannerAd}
						position={index}
						onImageError={() => setFailedServeIds((prev) => [...prev, bannerAd.serve_id])}
					/>
				)}
				loop={canSlide}
				autoplay={canSlide && screenFocused && appActive && !motionReduced}
				autoplayInterval={AD_AUTO_SLIDE_MS}
				scrollEnabled={canSlide}
				onSnapToItem={setCurrentIndex}
				style={styles.carousel}
			/>

			{/*현재 배너 순서 / 전체 배너 수*/}
			{canSlide && (
				<View style={styles.counter}>
					<Copy style={styles.counterText}>{`${currentBannerIndex + 1} / ${bannerAds.length}`}</Copy>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginTop: 4,
		marginBottom: 16,
		borderRadius: radius.card,
		borderCurve: 'continuous',
		overflow: 'hidden',
	},
	carousel: { width: '100%', aspectRatio: 3 },
	counter: {
		position: 'absolute',
		right: 8,
		bottom: 8,
		height: 20,
		justifyContent: 'center',
		paddingHorizontal: 8,
		borderRadius: radius.pill,
		backgroundColor: colors.backdrop,
	},
	counterText: { fontFamily: font.extraBold, fontSize: 11, color: colors.onFilled, fontVariant: ['tabular-nums'] },
});

export default HomeBanner;
