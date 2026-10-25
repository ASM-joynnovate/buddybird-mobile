import { useRef } from 'react';

import { useTranslation } from 'react-i18next';

import type { BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';

import SpeciesPickerList, { type SpeciesItem } from '@/screens/parrot/components/species-picker/list';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { isSpeciesId, type SpeciesGroup, speciesGroups, type SpeciesId } from '@/utils/species';

import { ItemPicker } from '@/components/ui/item/picker';

const MAX_SCROLL_RETRIES = 3;
const SCROLL_DELAY_MS = 150;

interface Props {
	species: string;
	onChange: (value: string) => void;
	disabled: boolean;
	isFirstInGroup?: boolean;
}

/**
 * 종 선택 컴포넌트
 * @param species 선택한 종 ID
 * @param onChange 종 선택 시 실행할 함수
 * @param disabled 비활성화 여부
 * @param isFirstInGroup 첫 항목 여부
 */
const SpeciesPicker = ({ species, onChange, disabled, isFirstInGroup }: Props) => {
	const { t } = useTranslation();

	const listRef = useRef<BottomSheetFlatListMethods>(null);
	const scrollRetriesRef = useRef(0);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const speciesItems: SpeciesItem[] = Object.entries(speciesGroups)
		.flatMap(([group, ids]) =>
			ids.map((id) => ({ id, group: group as SpeciesGroup, name: t(`parrot.speciesNames.${id}`) })),
		)
		.sort((a, b) => a.name.localeCompare(b.name, locale));

	/** 선택한 종이 목록 가운데에 오도록 스크롤하는 함수 */
	const scrollToSelected = () => {
		const index = speciesItems.findIndex((speciesItem) => speciesItem.id === species);

		if (index < 0) {
			return;
		}

		listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false });
	};

	/** bottom sheet 표시 후 선택한 종으로 스크롤 */
	const handleScrollToSelected = () => {
		scrollRetriesRef.current = 0;

		setTimeout(scrollToSelected, SCROLL_DELAY_MS);
	};

	/** 항목이 아직 렌더링되지 않았으면 다시 스크롤 */
	const handleRetryScroll = () => {
		if (scrollRetriesRef.current < MAX_SCROLL_RETRIES) {
			scrollRetriesRef.current += 1;

			requestAnimationFrame(scrollToSelected);
		}
	};

	const handleSelectSpecies = (speciesId: SpeciesId, close: () => void) => {
		onChange(speciesId);

		close();
	};

	return (
		<ItemPicker
			itemProps={{
				isFirstInGroup,
				label: t('parrot.species'),
				value: isSpeciesId(species) ? t(`parrot.speciesNames.${species}`) : t('parrot.choose'),
				disabled,
			}}
			sheet={{
				title: t('parrot.speciesQuestion'),
				listLayout: true,
				onOpened: handleScrollToSelected,
			}}
		>
			{(close) => (
				<SpeciesPickerList
					speciesItems={speciesItems}
					species={species}
					listRef={listRef}
					onSelect={(speciesId) => handleSelectSpecies(speciesId, close)}
					onScrollToIndexFailed={handleRetryScroll}
				/>
			)}
		</ItemPicker>
	);
};

export default SpeciesPicker;
