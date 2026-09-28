import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquareTextIcon, MicIcon, MoonIcon, SmartphoneIcon } from 'lucide-react-native';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import GuidePager, { type GuideStep } from '@/components/guide-pager';

/** 녹음 방법 안내와 다시 보지 않기 선택을 보여 주고 안내를 마치면 녹음 화면을 열거나 이전 화면으로 돌아가는 화면 */
const RecordingGuideScreen = () => {
	const { t } = useTranslation();

	const { params } = useRoute<RouteProp<RootStackParamList, 'RecordingGuide'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const seenGuides = useDeviceSettingsStore((state) => state.seenGuides);
	const setGuideSeen = useDeviceSettingsStore((state) => state.setGuideSeen);

	const steps: GuideStep[] = [
		{
			title: t('words.guide.manyRecordings'),
			scene: t('words.guide.manyRecordingsScene'),
			icon: MicIcon,
		},
		{ title: t('words.guide.quiet'), scene: t('words.guide.quietScene'), icon: MoonIcon },
		{
			title: t('words.guide.distance'),
			scene: t('words.guide.distanceScene'),
			icon: SmartphoneIcon,
		},
		{
			title: t('words.guide.speakClearly'),
			scene: t('words.guide.speakClearlyScene'),
			icon: MessageSquareTextIcon,
		},
	];

	/** 녹음 추가로 열었으면 녹음 화면 열기, 아니면 이전 화면으로 돌아가기 */
	const handleLeave = () => {
		if (params.source === 'add') {
			navigation.replace('Recorder', { wordName: params.wordName });
		} else {
			navigation.goBack();
		}
	};

	return (
		<GuidePager
			steps={steps}
			actions={{ onFinish: handleLeave, onSkip: handleLeave }}
			finishLabel={t(params.source === 'add' ? 'words.guide.record' : 'common.done')}
			dontShowAgain={{
				value: seenGuides.recording,
				onChange: (seen) => setGuideSeen('recording', seen),
			}}
		/>
	);
};

export default RecordingGuideScreen;
