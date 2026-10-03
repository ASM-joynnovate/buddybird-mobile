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
 * 오류 및 로딩 wrapper
 * @param children 감싸는 내용
 * @param fallbackComponent 조회 실패 시 표시할 컴포넌트
 * @param suspenseFallback 로딩 중 표시할 내용
 */
const ErrorHandlingWrapper = ({ children, fallbackComponent, suspenseFallback }: Props) => {
	return (
		<QueryErrorResetBoundary>
			{({ reset }) => (
				<QueryErrorBoundary
					FallbackComponent={fallbackComponent}
					placeholder={suspenseFallback}
					onReset={reset}
				>
					<Suspense fallback={suspenseFallback}>{children}</Suspense>
				</QueryErrorBoundary>
			)}
		</QueryErrorResetBoundary>
	);
};

export default ErrorHandlingWrapper;
