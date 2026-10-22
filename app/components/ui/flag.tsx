import type { FC } from 'react';

import type { SvgProps } from 'react-native-svg';

const flagImages = require.context('../../../assets/images/flags', false, /^\.\/[a-z]{2}\.svg$/);
const flagKeys = new Set(flagImages.keys());

const sizes = {
	small: { width: 16, height: 12 },
	medium: { width: 20, height: 15 },
} as const;

interface Props {
	country: string | null;
	size?: keyof typeof sizes;
}

/**
 * 국가 코드에 맞는 국기 컴포넌트
 * @param country 대문자 두 글자 국가 코드
 * @param size 국기 크기
 */
export const Flag = ({ country, size = 'medium' }: Props) => {
	const key = `./${country?.toLowerCase()}.svg`;

	if (!flagKeys.has(key)) {
		return null;
	}

	const FlagImage = flagImages<{ default: FC<SvgProps> }>(key).default;

	return <FlagImage width={sizes[size].width} height={sizes[size].height} accessible={false} />;
};
