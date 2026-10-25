import { type ReactNode, useEffect, useState } from 'react';

import dayjs from 'dayjs';

const FALLBACK_MIN_DURATION_MS = 200;

interface Props {
	children: ReactNode;
	fallback: ReactNode;
	fallbackShownAt: number | null;
}

/**
 * 로딩 중 내용을 최소 시간 동안 유지하는 컴포넌트
 * @param children 로딩이 끝난 뒤 표시할 내용
 * @param fallback 로딩 중 표시할 내용
 * @param fallbackShownAt 로딩 중 내용을 표시한 시각
 */
const ErrorHandlingWrapperMinimumFallback = ({ children, fallback, fallbackShownAt }: Props) => {
	const [remainingMs] = useState(() =>
		fallbackShownAt === null ? 0 : Math.max(0, FALLBACK_MIN_DURATION_MS - (dayjs().valueOf() - fallbackShownAt)),
	);
	const [waiting, setWaiting] = useState(remainingMs > 0);

	/** 남은 시간이 지나면 내용 표시 */
	useEffect(() => {
		if (remainingMs === 0) {
			return;
		}

		const timer = setTimeout(() => setWaiting(false), remainingMs);

		return () => clearTimeout(timer);
	}, [remainingMs]);

	return waiting ? fallback : children;
};

export default ErrorHandlingWrapperMinimumFallback;
