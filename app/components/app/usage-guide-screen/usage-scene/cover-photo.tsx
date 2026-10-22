import { Image, type ImageSourcePropType, StyleSheet } from 'react-native';

import type { SceneArea } from '@/components/scene-stage';

interface PhotoPoint {
	x: number;
	y: number;
}

interface CoverLayout {
	width: number;
	height: number;
	left: number;
	top: number;
}

/**
 * 장면을 덮는 사진 크기 및 위치 계산 함수
 * @param area 장면 영역
 * @param aspectRatio 사진의 폭 ÷ 높이
 * @param focusY 위쪽이 잘리는 비율
 */
export const getCoverLayout = (area: SceneArea, aspectRatio: number, focusY: number): CoverLayout => {
	const width = Math.max(area.width, area.height * aspectRatio);
	const height = width / aspectRatio;

	return { width, height, left: (area.width - width) / 2, top: (area.height - height) * focusY };
};

/**
 * 사진 비율 좌표를 장면 좌표로 변환하는 함수
 * @param layout 사진의 크기 및 위치
 * @param point 사진 폭 및 높이에 대한 비율 좌표
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
 * 장면을 덮는 사진 컴포넌트
 * @param source 사진
 * @param layout 사진의 크기 및 위치
 */
const UsageSceneCoverPhoto = ({ source, layout }: Props) => {
	return <Image accessibilityIgnoresInvertColors source={source} style={[styles.photo, layout]} />;
};

const styles = StyleSheet.create({
	photo: { position: 'absolute' },
});

export default UsageSceneCoverPhoto;
