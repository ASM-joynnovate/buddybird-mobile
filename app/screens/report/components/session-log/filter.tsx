import type { ComponentType } from 'react';

import { type LayoutChangeEvent, ScrollView, StyleSheet } from 'react-native';

import type { LogFilter, StickyLayout } from '@/types/session-log';

import { useTranslation } from 'react-i18next';

import { ListIcon } from 'lucide-react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';

import { colors } from '@/theme';

import { Chip } from '@/components/ui/chip';

import MimicIcon from '@assets/images/icons/report/events/mimic.svg';
import SoundIcon from '@assets/images/icons/report/events/sound.svg';
import AlertIcon from '@assets/images/icons/report/stats/alert.svg';

const ICON_SIZE = 18;

const logFilters: LogFilter[] = ['all', 'sound', 'word', 'emergency'];

const filterIcons: Record<Exclude<LogFilter, 'all'>, ComponentType<SvgProps>> = {
	sound: SoundIcon,
	word: MimicIcon,
	emergency: AlertIcon,
};

interface Props {
	selectedFilter: LogFilter;
	wordName: string;
	scrollY: SharedValue<number>;
	logBottom: SharedValue<number>;
	filterLayout: SharedValue<StickyLayout>;
	onSelect: (logFilter: LogFilter) => void;
}

/**
 * 스크롤 시 위에 고정되는 기록 필터 컴포넌트
 * @param selectedFilter 선택한 필터
 * @param wordName 세션에서 학습한 단어
 * @param scrollY 화면 스크롤 위치
 * @param logBottom 기록 아래쪽 끝 위치
 * @param filterLayout 필터 위치를 저장할 값
 * @param onSelect 필터를 누르면 실행할 함수
 */
const SessionLogFilter = ({ selectedFilter, wordName, scrollY, logBottom, filterLayout, onSelect }: Props) => {
	const { t } = useTranslation();

	const stickyStyle = useAnimatedStyle(() => {
		const { y, height } = filterLayout.get();
		const translateY = Math.min(Math.max(scrollY.get() - y, 0), Math.max(logBottom.get() - y - height, 0));

		return { transform: [{ translateY }] };
	});

	const handleSaveLayout = (event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;

		filterLayout.set({ y, height });
	};

	return (
		<Animated.View style={[styles.container, stickyStyle]} onLayout={handleSaveLayout}>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
				{logFilters.map((logFilter) => {
					const selected = logFilter === selectedFilter;
					const FilterIcon = logFilter === 'all' ? null : filterIcons[logFilter];

					return (
						<Chip
							key={logFilter}
							label={logFilter === 'word' ? wordName : t(`report.detail.filters.${logFilter}`)}
							leading={
								FilterIcon ? (
									<FilterIcon width={ICON_SIZE} height={ICON_SIZE} />
								) : (
									<ListIcon size={16} color={selected ? colors.onFilled : colors.muted} />
								)
							}
							selected={selected}
							size="small"
							onPress={() => onSelect(logFilter)}
							style={styles.chip}
						/>
					);
				})}
			</ScrollView>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: { zIndex: 2, marginHorizontal: -24, backgroundColor: colors.background },
	chips: { flexGrow: 1, gap: 6, paddingHorizontal: 24, paddingVertical: 8 },
	chip: { flexGrow: 1, maxWidth: 160 },
});

export default SessionLogFilter;
