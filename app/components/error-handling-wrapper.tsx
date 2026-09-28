import { type ComponentType, type ReactNode, Suspense } from 'react';

import { QueryErrorResetBoundary } from '@tanstack/react-query';

import type { ErrorFallbackProps } from '@/types/error-boundary';

import QueryErrorBoundary from '@/components/query-error-boundary';

interface Props {
	children: ReactNode;
	fallbackComponent: ComponentType<ErrorFallbackProps>;
	suspenseFallback: ReactNode;
}

/**
 * 조회 실패와 불러오는 중 표시
 * @param children 조회하는 내용
 * @param fallbackComponent 조회 실패 시 표시할 컴포넌트
 * @param suspenseFallback 불러오는 중 표시할 내용
 */
const ErrorHandlingWrapper = ({ children, fallbackComponent, suspenseFallback }: Props) => {
	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<QueryErrorBoundary FallbackComponent={fallbackComponent} onReset={reset}>
					<Suspense fallback={suspenseFallback}>{children}</Suspense>
				</QueryErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};

export default ErrorHandlingWrapper;
