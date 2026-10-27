import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

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

/**
 * 휴대폰 틀 크기 계산 함수
 * @param scale 휴대폰 틀 배율
 */
export const getPhoneFrameSize = (scale: number) => ({
	width: (SCREEN_WIDTH + BEZEL * 2) * scale,
	height: (SCREEN_HEIGHT + BEZEL * 2) * scale,
});

interface Props {
	area: SceneArea;
	topInset: number;
	scale?: number;
	isFullScreen?: boolean;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
}

/**
 * 휴대폰 틀 컴포넌트
 * @param area 장면 영역
 * @param topInset 상단 헤더 높이
 * @param scale 휴대폰 틀 배율
 * @param isFullScreen 내용을 화면 전체에 표시할지 여부
 * @param style 휴대폰 틀 위치
 * @param children 휴대폰 화면 내용
 */
const GuideScenePhoneFrame = ({ area, topInset, scale: fixedScale, isFullScreen = false, style, children }: Props) => {
	const top = topInset + 4;
	const scale = fixedScale ?? getFrameScale(area, top);

	return (
		<Animated.View
			entering={FadeInDown.duration(360)}
			style={[
				styles.frame,
				{
					top,
					left: (area.width - getPhoneFrameSize(scale).width) / 2,
					padding: BEZEL * scale,
					borderRadius: (SCREEN_RADIUS + BEZEL) * scale,
				},
				style,
			]}
		>
			<View
				style={[
					styles.screen,
					{ width: SCREEN_WIDTH * scale, height: SCREEN_HEIGHT * scale, borderRadius: SCREEN_RADIUS * scale },
				]}
			>
				<View style={[styles.content, { transform: [{ scale }] }]}>
					<View style={isFullScreen ? StyleSheet.absoluteFill : styles.body}>{children}</View>
					<View style={styles.island} />
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

export default GuideScenePhoneFrame;
