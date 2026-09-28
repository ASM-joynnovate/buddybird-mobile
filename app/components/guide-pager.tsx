import { useCallback, useEffect, useState } from 'react';

import { BackHandler, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronLeftIcon, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contentMaxWidth } from '@/theme';

import { BuddySays } from '@/components/buddy-says';
import { Illustration } from '@/components/illustration';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { PageDots } from '@/components/ui/page-dots';
import { Screen } from '@/components/ui/screen';
import { TextButton } from '@/components/ui/text-button';

export type GuideStep = { title: string; scene: string; icon: LucideIcon };

interface Props {
	steps: readonly GuideStep[];
	actions: { onFinish: () => void; onSkip?: () => void; onBack?: () => void };
	dontShowAgain?: { value: boolean; onChange(value: boolean): void };
	finishLabel?: string;
}

export function GuidePager({ steps, actions, dontShowAgain, finishLabel }: Props) {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const insets = useSafeAreaInsets();

	const [index, setIndex] = useState(0);

	const step = steps[index];
	const isLastStep = index === steps.length - 1;
	const back = index > 0 ? () => setIndex(index - 1) : actions.onBack;

	useEffect(() => {
		navigation.setOptions({ gestureEnabled: index === 0 });
	}, [index, navigation]);

	useFocusEffect(
		useCallback(() => {
			if (index === 0) {
				return;
			}

			const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
				setIndex(index - 1);

				return true;
			});

			return () => subscription.remove();
		}, [index]),
	);

	return (
		<Screen scrollable={false}>
			<View style={[styles.screen, { paddingBottom: insets.bottom + 20 }]}>
				{/*뒤로 가기, 단계 표시, 건너뛰기*/}
				<View style={styles.top}>
					{back ? <IconButton icon={ChevronLeftIcon} label={t('common.back')} onPress={back} /> : null}
					<PageDots
						count={steps.length}
						currentIndex={index}
						label={t('common.stepProgress', { current: index + 1, total: steps.length })}
					/>
					<View style={styles.spacer} />
					{actions.onSkip ? (
						<TextButton label={t('common.skip')} variant="muted" onPress={actions.onSkip} />
					) : null}
				</View>

				{/*안내 말풍선과 그림*/}
				<View style={styles.body}>
					<BuddySays message={step.title} />
					<Illustration scene={step.scene} icon={step.icon} height={260} showMascot={false} />
				</View>

				{/*다시 보지 않기와 다음 버튼*/}
				<View style={styles.bottom}>
					{dontShowAgain ? (
						<ItemCheckbox
							first
							label={t('common.dontShowAgain')}
							checked={dontShowAgain.value}
							onToggle={() => dontShowAgain.onChange(!dontShowAgain.value)}
						/>
					) : null}
					<Button
						label={isLastStep ? (finishLabel ?? t('common.start')) : t('common.next')}
						onPress={() => (isLastStep ? actions.onFinish() : setIndex(index + 1))}
					/>
				</View>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	top: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 4 },
	spacer: { flex: 1 },
	body: { flex: 1, justifyContent: 'space-between', gap: 24, paddingTop: 16, paddingBottom: 24 },
	bottom: { gap: 12 },
});
