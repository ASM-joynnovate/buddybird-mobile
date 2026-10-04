import { type ComponentType, type ReactNode, Suspense } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';

import type { ErrorFallbackProps, ErrorSize } from '@/types/error-boundary';

import QueryErrorBoundary from '@/components/query-error-boundary';

interface Props {
	children: ReactNode;
	fallbackComponent: ComponentType<ErrorFallbackProps>;
	suspenseFallback: ReactNode;
	errorSize?: ErrorSize;
}

/**
 * 오류 및 로딩 wrapper
 * @param children 감싸는 내용
 * @param fallbackComponent 조회 실패 시 표시할 컴포넌트
 * @param suspenseFallback 로딩 중 표시할 내용
 * @param errorSize 조회 실패 시 표시할 컴포넌트 크기
 */
const ErrorHandlingWrapper = ({ children, fallbackComponent, suspenseFallback, errorSize = 'screen' }: Props) => {
	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<QueryErrorBoundary
					FallbackComponent={fallbackComponent}
					placeholder={suspenseFallback}
					size={errorSize}
					onReset={reset}
				>
					<Suspense fallback={suspenseFallback}>{children}</Suspense>
				</QueryErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};

export default ErrorHandlingWrapper;
