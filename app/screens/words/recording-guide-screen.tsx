import type { ReactElement } from 'react';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquareTextIcon, MicIcon, MoonIcon, SmartphoneIcon } from 'lucide-react-native';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import { GuidePager, type GuideStep } from '@/components/guide-pager';

export function RecordingGuideScreen(): ReactElement {
	const { t } = useTranslation();

	const { params } = useRoute<RouteProp<RootStackParamList, 'RecordingGuide'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const seenGuides = useDeviceSettingsStore((state) => state.seenGuides);

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

	function leave() {
		if (params.source === 'add') {
			navigation.replace('Recorder', { wordName: params.wordName });
		} else {
			navigation.goBack();
		}
	}

	return (
		<GuidePager
			steps={steps}
			actions={{ onFinish: leave, onSkip: leave }}
			finishLabel={t(params.source === 'add' ? 'words.guide.record' : 'common.done')}
			dontShowAgain={{
				value: seenGuides.recording,
				onChange: (seen) => useDeviceSettingsStore.getState().setGuideSeen('recording', seen),
			}}
		/>
	);
}
