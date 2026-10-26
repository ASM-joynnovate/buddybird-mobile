import { memo, useEffect, useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import * as Haptics from 'expo-haptics';
import { Easing, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { burstEasing } from '@/theme';

import FeedCardLikeButtonHull from '@/components/feed-card/like-button/hull';
import FeedCardLikeButtonSeedLayers from '@/components/feed-card/like-button/seed-layers';

const LIKE_MS = 1170;
const CRACK_AT_MS = 200;
const LID_LAND_AT_MS = 525;
const CLOSE_MS = 280;

interface Props {
	liked: boolean;
}

/**
 * 해바라기 씨 좋아요 아이콘 컴포넌트
 * @param liked 좋아요 여부
 */
const FeedCardLikeButtonSeed = memo(({ liked }: Props) => {
	const motionReduced = useReducedMotion();

	const [layersMounted, setLayersMounted] = useState(liked);

	const likedRef = useRef(liked);

	const elapsed = useSharedValue(liked ? LIKE_MS : 0);
	const closeProgress = useSharedValue(0);

	/** 씨 까기 및 껍질 닫기 실행 */
	useEffect(() => {
		if (likedRef.current === liked) {
			return;
		}

		likedRef.current = liked;

		if (motionReduced) {
			elapsed.set(liked ? LIKE_MS : 0);
			closeProgress.set(0);
			setLayersMounted(liked);

			return;
		}

		if (liked) {
			setLayersMounted(true);
			closeProgress.set(0);
			elapsed.set(0);
			elapsed.set(
				withSequence(
					withTiming(CRACK_AT_MS, { duration: CRACK_AT_MS, easing: Easing.linear }, (finished) => {
						if (finished) {
							scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Rigid);
						}
					}),
					withTiming(
						LID_LAND_AT_MS,
						{ duration: LID_LAND_AT_MS - CRACK_AT_MS, easing: Easing.linear },
						(finished) => {
							if (finished) {
								scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light);
							}
						},
					),
					withTiming(LIKE_MS, { duration: LIKE_MS - LID_LAND_AT_MS, easing: Easing.linear }),
				),
			);

			return;
		}

		closeProgress.set(
			withTiming(1, { duration: CLOSE_MS, easing: burstEasing }, (finished) => {
				if (finished) {
					elapsed.set(0);
					closeProgress.set(0);
					scheduleOnRN(setLayersMounted, false);
				}
			}),
		);
	}, [closeProgress, elapsed, liked, motionReduced]);

	return (
		<View pointerEvents="none" style={styles.container}>
			{layersMounted ? (
				<FeedCardLikeButtonSeedLayers elapsed={elapsed} closeProgress={closeProgress} />
			) : (
				<FeedCardLikeButtonHull side="outside" />
			)}
		</View>
	);
});

const styles = StyleSheet.create({
	container: { width: 22, height: 22 },
});

export default FeedCardLikeButtonSeed;
