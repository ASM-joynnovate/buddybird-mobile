export const FIREBASE_NAME_LIMIT = 40;

/** 이벤트 속성을 Firebase의 이름과 값 길이 제한에 맞춰 변환, 보낼 수 없는 값은 제외 */
export const firebaseParameters = (eventParams: Record<string, unknown>) => {
	const firebaseParams: Record<string, string | number | boolean> = {};

	for (const [key, value] of Object.entries(eventParams)) {
		if (value == null || (typeof value === 'number' && !Number.isFinite(value))) {
			continue;
		}

		if (typeof value === 'string' || Array.isArray(value)) {
			firebaseParams[key.slice(0, FIREBASE_NAME_LIMIT)] = (Array.isArray(value) ? value.join(',') : value).slice(
				0,
				100,
			);
		} else if (typeof value === 'number' || typeof value === 'boolean') {
			firebaseParams[key.slice(0, FIREBASE_NAME_LIMIT)] = value;
		}
	}

	return firebaseParams;
};

/** 분석과 오류 보고 전송, 실패는 무시 */
export const sendTelemetrySafely = async (send: () => void | Promise<unknown>) => {
	try {
		await send();
	} catch {
		// 전송 실패가 학습, 저장, 앱 상태 변경 흐름을 멈추지 않도록 무시
	}
};
