import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquareTextIcon, MicIcon, MoonIcon, SmartphoneIcon } from 'lucide-react-native';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import GuidePager, { type GuideStep } from '@/components/guide-pager';

/** 녹음 안내 화면 */
const RecordingGuideScreen = () => {
	const { t } = useTranslation();

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

	return (
		<GuidePager
			steps={steps}
			actions={{ onFinish: () => navigation.goBack(), onSkip: () => navigation.goBack() }}
			finishLabel={t('common.done')}
			dontShowAgain={{
				value: seenGuides.recording,
				onChange: (seen) => setGuideSeen('recording', seen),
			}}
		/>
	);
};

export default RecordingGuideScreen;
