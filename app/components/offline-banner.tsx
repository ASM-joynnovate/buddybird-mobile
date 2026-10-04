import { type ReactNode, useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOffIcon } from 'lucide-react-native';
import Animated, {
	Easing,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, contentMaxWidth, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const SHOW_MS = 320;
const HIDE_MS = 240;
const bannerEasing = Easing.out(Easing.cubic);

interface Props {
	children: ReactNode;
}

/**
 * 인터넷 연결이 끊기면 상태 표시줄 아래에 안내를 띄우고 화면을 그 높이만큼 아래로 내리는 컴포넌트
 * @param children 안내 아래에 놓이는 화면
 */
const OfflineBanner = ({ children }: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const reducedMotion = useReducedMotion();

	const { isConnected } = useNetInfo();
	const offline = isConnected === false;

	const [bannerVisible, setBannerVisible] = useState(false);
	const [bannerHeight, setBannerHeight] = useState(0);

	const progress = useSharedValue(0);

	const contentStyle = useAnimatedStyle(() => ({ marginTop: progress.get() * bannerHeight }));
	const coverStyle = useAnimatedStyle(() => ({
		height: insets.top + progress.get() * bannerHeight,
		opacity: progress.get(),
	}));
	const slotStyle = useAnimatedStyle(() => ({ height: progress.get() * bannerHeight }));

	/** 연결이 끊기면 안내 높이를 측정한 뒤 펼치고, 다시 연결되면 접은 다음 안내를 내림 */
	useEffect(() => {
		if (offline) {
			setBannerVisible(true);
		}

		if (offline && bannerHeight === 0) {
			return;
		}

		const target = offline ? 1 : 0;

		if (reducedMotion) {
			progress.set(target);
			setBannerVisible(offline);

			return;
		}

		progress.set(
			withTiming(target, { duration: offline ? SHOW_MS : HIDE_MS, easing: bannerEasing }, (finished) => {
				if (finished && !offline) {
					scheduleOnRN(setBannerVisible, false);
				}
			}),
		);
	}, [bannerHeight, offline, progress, reducedMotion]);

	return (
		<View style={styles.container}>
			<Animated.View style={[styles.content, contentStyle]}>{children}</Animated.View>

			{bannerVisible && (
				<Animated.View pointerEvents="none" style={[styles.cover, coverStyle]}>
					<Animated.View style={[styles.slot, { top: insets.top }, slotStyle]}>
						<View
							accessibilityRole="alert"
							accessibilityLiveRegion="polite"
							style={styles.bannerContainer}
							onLayout={(event) => setBannerHeight(event.nativeEvent.layout.height)}
						>
							<View style={styles.banner}>
								<WifiOffIcon size={18} color={colors.onFilled} />
								<Copy style={styles.text}>{t('common.offline')}</Copy>
							</View>
						</View>
					</Animated.View>
				</Animated.View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	content: { flex: 1 },
	cover: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.background },
	slot: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
	bannerContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingTop: 4,
		paddingBottom: 8,
	},
	banner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		maxWidth: contentMaxWidth,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.text,
	},
	text: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13.5, color: colors.onFilled },
});

export default OfflineBanner;
