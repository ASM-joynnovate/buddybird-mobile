import { type ComponentType, type ReactNode, Suspense, useState } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';

import type { ErrorFallbackProps, ErrorSize } from '@/types/error-boundary';

import ErrorHandlingWrapperDelayedFallback from '@/components/error-handling-wrapper/delayed-fallback';
import QueryErrorBoundary from '@/components/error-handling-wrapper/error-boundary';
import ErrorHandlingWrapperMinimumFallback from '@/components/error-handling-wrapper/minimum-fallback';

interface Props {
	children: ReactNode;
	fallbackComponent: ComponentType<ErrorFallbackProps>;
	suspenseFallback: ReactNode;
	fallbackDelayed?: boolean;
	errorSize?: ErrorSize;
}

/**
 * 조회 실패 및 로딩 화면 표시 컴포넌트
 * @param children 감싸는 내용
 * @param fallbackComponent 조회 실패 시 표시할 컴포넌트
 * @param suspenseFallback 로딩 중 표시할 내용
 * @param fallbackDelayed 로딩 중 내용의 지연 표시 여부
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
								<ErrorHandlingWrapperDelayedFallback onShow={setFallbackShownAt}>
									{suspenseFallback}
								</ErrorHandlingWrapperDelayedFallback>
							) : (
								suspenseFallback
							)
						}
					>
						<ErrorHandlingWrapperMinimumFallback
							fallback={suspenseFallback}
							fallbackShownAt={fallbackShownAt}
						>
							{children}
						</ErrorHandlingWrapperMinimumFallback>
					</Suspense>
				</QueryErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};

export default ErrorHandlingWrapper;
