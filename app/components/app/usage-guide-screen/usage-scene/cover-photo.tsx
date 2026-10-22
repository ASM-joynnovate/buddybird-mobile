import { Image, type ImageSourcePropType, StyleSheet } from 'react-native';

import type { SceneArea } from '@/components/scene-stage';

export interface PhotoPoint {
	x: number;
	y: number;
}

export interface CoverLayout {
	width: number;
	height: number;
	left: number;
	top: number;
}

/**
 * 사진이 장면 영역을 빈틈없이 덮도록 한 크기와 위치를 반환하는 함수
 * @param area 장면 영역
 * @param aspectRatio 사진의 폭 ÷ 높이
 * @param focusY 잘리는 높이를 위아래로 나누는 비율. 0이면 위쪽만, 1이면 아래쪽만 잘린다
 */
export const getCoverLayout = (area: SceneArea, aspectRatio: number, focusY: number): CoverLayout => {
	const width = Math.max(area.width, area.height * aspectRatio);
	const height = width / aspectRatio;

	return { width, height, left: (area.width - width) / 2, top: (area.height - height) * focusY };
};

/**
 * 사진 안의 비율 좌표를 장면 영역의 좌표로 바꾸는 함수
 * @param layout 사진의 크기와 위치
 * @param point 사진 폭과 높이에 대한 비율 좌표
 */
export const toScenePoint = (layout: CoverLayout, point: PhotoPoint): PhotoPoint => ({
	x: layout.left + layout.width * point.x,
	y: layout.top + layout.height * point.y,
});

interface Props {
	source: ImageSourcePropType;
	layout: CoverLayout;
}

/**
 * 장면 영역을 덮는 사진 컴포넌트
 * @param source 사진
 * @param layout 사진의 크기와 위치
 */
const CoverPhoto = ({ source, layout }: Props) => {
	return <Image accessibilityIgnoresInvertColors source={source} style={[styles.photo, layout]} />;
};

const styles = StyleSheet.create({
	photo: { position: 'absolute' },
});

export default CoverPhoto;
