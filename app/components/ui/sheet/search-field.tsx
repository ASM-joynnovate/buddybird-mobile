import { StyleSheet, View } from 'react-native';

import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { CircleXIcon, SearchIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';

import { IconButton } from '@/components/ui/icon-button';

interface Props {
	value: string;
	placeholder: string;
	clearLabel: string;
	onChangeText: (text: string) => void;
}

/**
 * bottom sheet 안의 검색창 컴포넌트
 * @param value 검색어
 * @param placeholder 검색창 안내 문구
 * @param clearLabel 검색어 지우기 버튼 이름
 * @param onChangeText 검색어 변경 시 실행할 함수
 */
export const SheetSearchField = ({ value, placeholder, clearLabel, onChangeText }: Props) => {
	return (
		<View>
			<SearchIcon size={20} color={colors.muted} style={styles.searchIcon} />
			<BottomSheetTextInput
				value={value}
				onChangeText={onChangeText}
				accessibilityLabel={placeholder}
				placeholder={placeholder}
				placeholderTextColor={colors.muted}
				allowFontScaling={false}
				autoCapitalize="none"
				autoCorrect={false}
				returnKeyType="search"
				style={styles.searchInput}
			/>
			{!!value && (
				<View style={styles.clearButtonContainer}>
					<IconButton
						icon={CircleXIcon}
						iconProps={{ color: colors.onFilled, fill: colors.subtle }}
						label={clearLabel}
						variant="muted"
						size="small"
						onPress={() => onChangeText('')}
					/>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	searchIcon: { position: 'absolute', left: 14, top: 15, zIndex: 1 },
	searchInput: {
		minHeight: 50,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: 14,
		paddingLeft: 44,
		paddingRight: 44,
		paddingVertical: 10,
		fontFamily: font.bold,
		fontSize: 16,
		color: colors.text,
	},
	clearButtonContainer: { position: 'absolute', right: 3, top: 3 },
});
