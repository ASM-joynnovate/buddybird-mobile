import { type ReactNode, useEffect, useState } from 'react';

import dayjs from 'dayjs';

const FALLBACK_DELAY_MS = 500;

interface Props {
	children: ReactNode;
	onShow: (shownAt: number) => void;
}

/**
 * 로딩이 길어질 때만 표시하는 컴포넌트
 * @param children 로딩 중 표시할 내용
 * @param onShow 로딩 중 내용을 표시할 때 실행할 함수
 */
const ErrorHandlingWrapperDelayedFallback = ({ children, onShow }: Props) => {
	const [visible, setVisible] = useState(false);

	/** 지연 시간 뒤 표시 및 표시 시각 저장 */
	useEffect(() => {
		const timer = setTimeout(() => {
			onShow(dayjs().valueOf());

			setVisible(true);
		}, FALLBACK_DELAY_MS);

		return () => clearTimeout(timer);
	}, [onShow]);

	return visible ? children : null;
};

export default ErrorHandlingWrapperDelayedFallback;
