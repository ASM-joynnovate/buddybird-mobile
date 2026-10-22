import type { LoginProvider } from '@/types/account';

import Svg, { Path } from 'react-native-svg';

import { loginProviderColors } from '@/theme';

interface Props {
	provider: LoginProvider;
	size: number;
	hidden?: boolean;
}

/**
 * 로그인 방식 로고 컴포넌트
 * @param provider 로그인 방식
 * @param size 로고 크기
 * @param hidden 자리는 남기고 로고를 숨길지 여부
 */
const ProviderLogo = ({ provider, size, hidden = false }: Props) => {
	if (provider === 'google') {
		// Google 브랜드 가이드가 제공한 로고 경로
		return (
			<Svg width={size} height={size} viewBox="0 0 48 48" accessible={false} opacity={hidden ? 0 : 1}>
				<Path
					fill={loginProviderColors.google.logo.red}
					d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
				/>
				<Path
					fill={loginProviderColors.google.logo.blue}
					d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
				/>
				<Path
					fill={loginProviderColors.google.logo.yellow}
					d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
				/>
				<Path
					fill={loginProviderColors.google.logo.green}
					d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
				/>
			</Svg>
		);
	}

	if (provider === 'kakao') {
		return (
			<Svg width={size} height={size} viewBox="0 0 18 18" accessible={false} opacity={hidden ? 0 : 1}>
				<Path
					fill={loginProviderColors.kakao.icon}
					d="M9 1C4.029 1 0 4.129 0 7.987c0 2.399 1.558 4.516 3.932 5.774l-1 3.665c-.09.323.28.58.563.393L7.87 14.87c.37.041.747.063 1.13.063 4.971 0 9-3.129 9-6.987C18 4.129 13.971 1 9 1Z"
				/>
			</Svg>
		);
	}

	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" accessible={false} opacity={hidden ? 0 : 1}>
			<Path
				fill={loginProviderColors.apple.background}
				d="M16.37 12.6c-.02-2.36 1.93-3.5 2.02-3.55-1.1-1.61-2.81-1.83-3.42-1.85-1.45-.15-2.84.86-3.58.86-.74 0-1.88-.84-3.09-.82-1.59.02-3.06.93-3.88 2.35-1.66 2.87-.42 7.12 1.19 9.45.79 1.14 1.73 2.42 2.96 2.37 1.19-.05 1.64-.77 3.07-.77 1.43 0 1.84.77 3.09.74 1.28-.02 2.09-1.16 2.87-2.31.9-1.32 1.27-2.6 1.29-2.67-.03-.01-2.47-.95-2.5-3.79ZM14.03 5.66c.65-.79 1.09-1.88.97-2.97-.94.04-2.07.62-2.75 1.41-.6.7-1.13 1.82-.99 2.89 1.05.08 2.12-.53 2.77-1.33Z"
			/>
		</Svg>
	);
};

export default ProviderLogo;
