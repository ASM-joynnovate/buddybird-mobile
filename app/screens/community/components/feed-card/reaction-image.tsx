import { Image } from 'react-native';

import { SvgUri } from 'react-native-svg';

interface Props {
	url: string;
	size: number;
}

/**
 * 서버가 준 반응 그림 컴포넌트
 * @param url 반응 그림 주소
 * @param size 그림 크기
 */
const FeedCardReactionImage = ({ url, size }: Props) => {
	if (new URL(url).pathname.endsWith('.svg')) {
		return <SvgUri uri={url} width={size} height={size} />;
	}

	return <Image source={{ uri: url }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />;
};

export default FeedCardReactionImage;
