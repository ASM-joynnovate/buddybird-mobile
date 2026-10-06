import { Galeria } from '@nandorojo/galeria';

import AttachedImagesItem from '@/screens/home/components/attached-images/item';

interface AttachedImage {
	uri: string;
	label: string;
}

interface Props {
	images: AttachedImage[];
}

/**
 * 첨부 사진 목록 컴포넌트
 * @param images 사진 주소 및 스크린 리더가 읽는 이름
 */
const AttachedImages = ({ images }: Props) => {
	return (
		<Galeria urls={images.map((image) => image.uri)} theme="light">
			{images.map((image, index) => (
				<AttachedImagesItem key={`${image.uri}-${index}`} index={index} uri={image.uri} label={image.label} />
			))}
		</Galeria>
	);
};

export default AttachedImages;
