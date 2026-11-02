import { StyleSheet, View } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	title: string;
	detail?: string;
}

/**
 * 안내 팻말 문구 컴포넌트
 * @param title 할 일 문구
 * @param detail 부가 설명 문구
 */
const ReportGuideSignMessage = ({ title, detail }: Props) => {
	return (
		<View>
			<Copy style={styles.title}>{title}</Copy>
			{!!detail && <Copy style={styles.detail}>{detail}</Copy>}
		</View>
	);
};

const styles = StyleSheet.create({
	title: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 20 },
	detail: { fontFamily: font.bold, fontSize: 12.5, lineHeight: 17, color: colors.muted },
});

export default ReportGuideSignMessage;
