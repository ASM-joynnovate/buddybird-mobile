import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import type { SceneArea } from '@/types/scene';

import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radius } from '@/theme';

const SCREEN_WIDTH = 393;
const SCREEN_HEIGHT = 852;
const SCREEN_RADIUS = 54;
const BEZEL = 12;
const ISLAND_WIDTH = 124;
const BODY_SIDE = 24;
const FRAME_COLOR = '#1d1d1f';

/**
 * 휴대폰 틀 배율 계산 함수
 * @param area 장면 영역
 * @param top 휴대폰 틀 위쪽 위치
 */
const getFrameScale = (area: SceneArea, top: number) => {
	const widthScale = (area.width * 0.87) / SCREEN_WIDTH;
	const visibleHeight = area.height - radius.sheet - top;

	return Math.min(widthScale, 1.25, Math.max(0.68, visibleHeight / 630));
};

interface Props {
	area: SceneArea;
	topInset: number;
	children: ReactNode;
}

/**
 * 휴대폰 틀 컴포넌트
 * @param area 장면 영역
 * @param topInset 상단 헤더 높이
 * @param children 휴대폰 화면 내용
 */
const UsageScenePhoneFrame = ({ area, topInset, children }: Props) => {
	const top = topInset + 4;
	const scale = getFrameScale(area, top);

	return (
		<Animated.View
			entering={FadeInDown.duration(360)}
			style={[
				styles.frame,
				{
					top,
					left: (area.width - (SCREEN_WIDTH + BEZEL * 2) * scale) / 2,
					padding: BEZEL * scale,
					borderRadius: (SCREEN_RADIUS + BEZEL) * scale,
				},
			]}
		>
			<View
				style={[
					styles.screen,
					{ width: SCREEN_WIDTH * scale, height: SCREEN_HEIGHT * scale, borderRadius: SCREEN_RADIUS * scale },
				]}
			>
				<View style={[styles.content, { transform: [{ scale }] }]}>
					<View style={styles.island} />
					<View style={styles.body}>{children}</View>
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	frame: { position: 'absolute', borderCurve: 'continuous', backgroundColor: FRAME_COLOR },
	screen: { overflow: 'hidden', borderCurve: 'continuous', backgroundColor: colors.background },
	content: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, transformOrigin: 'top left' },
	island: {
		position: 'absolute',
		top: 11,
		left: (SCREEN_WIDTH - ISLAND_WIDTH) / 2,
		width: ISLAND_WIDTH,
		height: 36,
		borderRadius: radius.pill,
		backgroundColor: FRAME_COLOR,
	},
	body: { position: 'absolute', top: 62, right: BODY_SIDE, left: BODY_SIDE },
});

export default UsageScenePhoneFrame;
