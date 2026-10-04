import { type ComponentType, type ReactNode, Suspense, useEffect, useState } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';

import type { ErrorFallbackProps, ErrorSize } from '@/types/error-boundary';

import QueryErrorBoundary from '@/components/query-error-boundary';

const FALLBACK_DELAY_MS = 500;
const FALLBACK_MIN_DURATION_MS = 200;

interface DelayedFallbackProps {
	children: ReactNode;
	onShow: (shownAt: number) => void;
}

/**
 * 로딩이 FALLBACK_DELAY_MS보다 길어질 때만 로딩 중 내용을 표시하는 컴포넌트
 * @param children 로딩 중 표시할 내용
 * @param onShow 로딩 중 내용을 표시할 때 실행할 함수
 */
const DelayedFallback = ({ children, onShow }: DelayedFallbackProps) => {
	const [visible, setVisible] = useState(false);

	/** FALLBACK_DELAY_MS 뒤에 표시하고 표시한 시각 저장 */
	useEffect(() => {
		const timer = setTimeout(() => {
			onShow(Date.now());

			setVisible(true);
		}, FALLBACK_DELAY_MS);

		return () => clearTimeout(timer);
	}, [onShow]);

	return visible ? children : null;
};

interface MinimumFallbackProps {
	children: ReactNode;
	fallback: ReactNode;
	fallbackShownAt: number | null;
}

/**
 * 로딩 중 내용이 표시됐다면 FALLBACK_MIN_DURATION_MS가 지난 뒤에 내용을 표시하는 컴포넌트
 * @param children 로딩이 끝난 뒤 표시할 내용
 * @param fallback 로딩 중 표시할 내용
 * @param fallbackShownAt 로딩 중 내용을 표시한 시각
 */
const MinimumFallback = ({ children, fallback, fallbackShownAt }: MinimumFallbackProps) => {
	const [remainingMs] = useState(() =>
		fallbackShownAt === null ? 0 : Math.max(0, FALLBACK_MIN_DURATION_MS - (Date.now() - fallbackShownAt)),
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

interface Props {
	children: ReactNode;
	fallbackComponent: ComponentType<ErrorFallbackProps>;
	suspenseFallback: ReactNode;
	fallbackDelayed?: boolean;
	errorSize?: ErrorSize;
}

/**
 * 오류 및 로딩 wrapper
 * @param children 감싸는 내용
 * @param fallbackComponent 조회 실패 시 표시할 컴포넌트
 * @param suspenseFallback 로딩 중 표시할 내용
 * @param fallbackDelayed 로딩 중 내용을 FALLBACK_DELAY_MS 뒤에 표시할지 여부
 * @param errorSize 조회 실패 시 표시할 컴포넌트 크기
 */
const ErrorHandlingWrapper = ({
	children,
	fallbackComponent,
	suspenseFallback,
	fallbackDelayed = true,
	errorSize = 'screen',
}: Props) => {
	const [fallbackShownAt, setFallbackShownAt] = useState<number | null>(null);

	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<QueryErrorBoundary
					FallbackComponent={fallbackComponent}
					placeholder={suspenseFallback}
					size={errorSize}
					onReset={reset}
				>
					<Suspense
						fallback={
							fallbackDelayed ? (
								<DelayedFallback onShow={setFallbackShownAt}>{suspenseFallback}</DelayedFallback>
							) : (
								suspenseFallback
							)
						}
					>
						<MinimumFallback fallback={suspenseFallback} fallbackShownAt={fallbackShownAt}>
							{children}
						</MinimumFallback>
					</Suspense>
				</QueryErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};

export default ErrorHandlingWrapper;
