import type { SceneArea } from '@/types/scene';

import GuideScenePhoneFrame from '@/components/guide-scene/phone-frame';
import GuideSceneSessionPreview from '@/components/guide-scene/session-preview';

const appearedPhoto: number = require('@assets/images/petcam-guide/appeared.jpg');

interface Props {
	area: SceneArea;
	topInset: number;
}

/**
 * 앵무새 사라짐 및 나타남 기록 장면 컴포넌트
 * @param area 장면 영역
 * @param topInset 상단 헤더 높이
 */
const PetcamSceneAlert = ({ area, topInset }: Props) => {
	return (
		<GuideScenePhoneFrame area={area} topInset={topInset}>
			<GuideSceneSessionPreview step="motion" appearedPhoto={appearedPhoto} showLogHeader={false} />
		</GuideScenePhoneFrame>
	);
};

export default PetcamSceneAlert;
