export const FIREBASE_NAME_LIMIT = 40;
const FIREBASE_VALUE_LIMIT = 100;

/** 이벤트 속성을 Firebase 제한에 맞추는 함수 */
export const firebaseParameters = (eventParams: object) => {
	const firebaseParams: Record<string, string | number | boolean> = {};

	for (const [key, value] of Object.entries(eventParams) as [string, unknown][]) {
		if (value == null || (typeof value === 'number' && !Number.isFinite(value))) {
			continue;
		}

		if (typeof value === 'string' || Array.isArray(value)) {
			firebaseParams[key.slice(0, FIREBASE_NAME_LIMIT)] = (Array.isArray(value) ? value.join(',') : value).slice(
				0,
				FIREBASE_VALUE_LIMIT,
			);
		} else if (typeof value === 'number' || typeof value === 'boolean') {
			firebaseParams[key.slice(0, FIREBASE_NAME_LIMIT)] = value;
		}
	}

	return firebaseParams;
};

/** 실패를 무시하는 분석 전송 함수 */
export const sendTelemetrySafely = async (send: () => void | Promise<unknown>) => {
	try {
		await send();
	} catch {
		// 전송 실패가 앱 동작을 멈추지 않도록 무시
	}
};
