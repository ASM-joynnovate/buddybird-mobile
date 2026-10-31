import { type StyleProp, StyleSheet, Text, type TextStyle } from 'react-native';

import * as WebBrowser from 'expo-web-browser';

import { reportError } from '@/services/telemetry/client';
import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';

const urlPattern = /(https?:\/\/[\w\-.~:/?#@!$&*+,;=%]*[\w\-~/#@$&*+=%])/;

interface Props {
	text: string;
	style?: StyleProp<TextStyle>;
	numberOfLines?: number;
}

/**
 * 본문 URL 링크 표시 컴포넌트
 * @param text 표시할 본문
 * @param style 본문 스타일
 * @param numberOfLines 최대 줄 수
 */
const LinkedCopy = ({ text, style, numberOfLines }: Props) => {
	return (
		<Copy style={style} numberOfLines={numberOfLines}>
			{text.split(urlPattern).map((part, index) =>
				index % 2 === 1 ? (
					<Text
						key={index}
						accessibilityRole="link"
						style={styles.link}
						onPress={() =>
							void WebBrowser.openBrowserAsync(part).catch((error) => reportError(error, 'body_link'))
						}
					>
						{part}
					</Text>
				) : (
					part
				),
			)}
		</Copy>
	);
};

const styles = StyleSheet.create({
	link: { color: colors.orangeDark, textDecorationLine: 'underline' },
});

export default LinkedCopy;
