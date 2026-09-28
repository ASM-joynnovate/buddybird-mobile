import { Component, type ComponentType, type ReactNode } from 'react';

import type { ErrorFallbackProps } from '@/types/error-boundary';

import { reportError } from '@/services/telemetry/client';

interface Props {
	FallbackComponent: ComponentType<ErrorFallbackProps>;
	onReset: () => void;
	children: ReactNode;
}

interface State {
	error: Error | null;
}

/**
 * 조회 오류 경계
 * @param FallbackComponent 오류 화면 컴포넌트
 * @param onReset 다시 시도할 때 실행할 조회 오류 초기화
 * @param children 감싸는 내용
 */
class QueryErrorBoundary extends Component<Props, State> {
	state: State = { error: null };

	/** 오류 상태 저장 */
	static getDerivedStateFromError = (error: Error) => {
		return { error };
	};

	/** 오류 보고 */
	componentDidCatch = (error: Error) => {
		reportError(error, 'error_boundary');
	};

	/** 조회 오류와 오류 상태 초기화 */
	reset = () => {
		this.props.onReset();

		this.setState({ error: null });
	};

	/** 오류 화면이나 내용 렌더링 */
	render = () => {
		const { FallbackComponent, children } = this.props;
		const { error } = this.state;

		if (error) {
			return <FallbackComponent error={error} onRetry={this.reset} />;
		}

		return children;
	};
}

export default QueryErrorBoundary;
