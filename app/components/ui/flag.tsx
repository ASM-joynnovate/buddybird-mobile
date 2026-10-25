import type { FC } from 'react';

import type { SvgProps } from 'react-native-svg';

const flagImages = require.context('../../../assets/images/flags', false, /^\.\/[a-z]{2}\.svg$/);
const flagKeys = new Set(flagImages.keys());

const sizes = {
	small: { width: 16, height: 12 },
	medium: { width: 20, height: 15 },
} as const;

interface FlagModule {
	default: FC<SvgProps>;
}

interface Props {
	country: string | null;
	size?: keyof typeof sizes;
}

export const Flag = ({ country, size = 'medium' }: Props) => {
	const flagKey = `./${country?.toLowerCase()}.svg`;

	if (!flagKeys.has(flagKey)) {
		return null;
	}

	const FlagImage = flagImages<FlagModule>(flagKey).default;

	return <FlagImage width={sizes[size].width} height={sizes[size].height} accessible={false} />;
};
