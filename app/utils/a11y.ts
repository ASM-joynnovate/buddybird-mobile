/** 접근성 라벨 조각을 하나의 문구로 합치는 함수 */
export const joinLabel = (...parts: (string | null | undefined | false)[]) => {
	return parts.filter(Boolean).join(', ');
};
