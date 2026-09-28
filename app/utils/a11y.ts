/** 빈 값을 뺀 접근성 라벨 조각을 쉼표로 이은 문구 */
export const joinLabel = (...parts: (string | null | undefined | false)[]) => {
	return parts.filter(Boolean).join(', ');
};
