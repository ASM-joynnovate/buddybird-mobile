import type { ReactNode } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

export const SCENE_FLOOR_HEIGHT = 36 + radius.sheet;

const MAX_STAGE_SCALE = 1.25;

export interface SceneArea {
	width: number;
	height: number;
}

/** 장면 영역에 맞춘 그림 배율을 반환하는 함수 */
export const getStageScale = (area: SceneArea, stageWidth: number, stageHeight: number) =>
	Math.max(0, Math.min(area.width / stageWidth, (area.height - SCENE_FLOOR_HEIGHT) / stageHeight, MAX_STAGE_SCALE));

interface Props {
	label: string;
	stageWidth: number;
	stageHeight: number;
	scale: number;
	onLayout: (event: LayoutChangeEvent) => void;
	children: ReactNode;
}

/**
 * 벽과 바닥 위에 그림을 놓는 장면 컴포넌트
 * @param label 화면 읽기 프로그램이 읽을 장면 설명
 * @param stageWidth 배율 1일 때 그림 영역의 폭
 * @param stageHeight 배율 1일 때 그림 영역의 높이
 * @param scale 그림 배율
 * @param onLayout 장면 크기가 정해질 때 실행할 함수
 * @param children 그림 영역에 놓을 요소
 */
const SceneStage = ({ label, stageWidth, stageHeight, scale, onLayout, children }: Props) => {
	return (
		<View
			accessible
			accessibilityRole="image"
			accessibilityLabel={label}
			onLayout={onLayout}
			style={styles.container}
		>
			<View style={styles.floor} />

			{scale > 0 && (
				<View style={[styles.stage, { width: stageWidth * scale, height: stageHeight * scale }]}>
					{children}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingBottom: SCENE_FLOOR_HEIGHT,
		overflow: 'hidden',
	},
	floor: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		height: SCENE_FLOOR_HEIGHT,
		backgroundColor: colors.orangeSoft,
	},
	stage: { position: 'relative' },
});

export default SceneStage;
