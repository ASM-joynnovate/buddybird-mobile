import { useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { Sheet } from '@/components/ui/sheet';

interface Props {
	visible: boolean;
	onTake: () => Promise<void>;
	onChoose: () => Promise<void>;
	onClose: () => void;
}

/**
 * 사진 가져올 방식 선택 bottom sheet 컴포넌트
 * @param visible bottom sheet 표시 여부
 * @param onTake 촬영을 선택할 때 실행할 함수
 * @param onChoose 앨범을 선택할 때 실행할 함수
 * @param onClose bottom sheet를 닫을 때 실행할 함수
 */
const PhotoSourceSheet = ({ visible, onTake, onChoose, onClose }: Props) => {
	const { t } = useTranslation();

	const pendingPickRef = useRef<(() => Promise<void>) | null>(null);

	const handleTakePhoto = () => {
		pendingPickRef.current = onTake;
		onClose();
	};

	const handleChoosePhoto = () => {
		pendingPickRef.current = onChoose;
		onClose();
	};

	/** bottom sheet가 닫힌 뒤 카메라나 앨범 실행 */
	const handleClose = () => {
		const pick = pendingPickRef.current;

		pendingPickRef.current = null;
		onClose();

		void pick?.();
	};

	return (
		<Sheet visible={visible} title={t('common.profilePhoto.title')} onClose={handleClose}>
			<ItemGroup>
				<Item isFirstInGroup label={t('common.profilePhoto.take')} onPress={handleTakePhoto} />
				<Item label={t('common.profilePhoto.choose')} onPress={handleChoosePhoto} />
			</ItemGroup>
		</Sheet>
	);
};

export default PhotoSourceSheet;
