import { useCallback, useEffect, useState } from 'react';

import { BackHandler, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronLeftIcon, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { contentMaxWidth } from '@/theme';

import BuddySays from '@/components/buddy-says';
import Illustration from '@/components/illustration';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { PageDots } from '@/components/ui/page-dots';
import { Screen } from '@/components/ui/screen';
import { TextButton } from '@/components/ui/text-button';

export interface GuideStep {
	title: string;
	scene: string;
	icon: LucideIcon;
}

interface Props {
	steps: readonly GuideStep[];
	actions: { onFinish: () => void; onSkip?: () => void; onBack?: () => void };
	dontShowAgain?: { value: boolean; onChange: (value: boolean) => void };
	finishLabel?: string;
}

/**
 * 단계별 안내 컴포넌트
 * @param steps 안내 단계 목록
 * @param actions 버튼을 누를 때 실행할 함수 목록
 * @param dontShowAgain 다시 보지 않기 선택 상태
 * @param finishLabel 마지막 단계의 버튼 문구
 */
const GuidePager = ({ steps, actions, dontShowAgain, finishLabel }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const insets = useSafeAreaInsets();

	const [index, setIndex] = useState(0);

	const step = steps[index];
	const isLastStep = index === steps.length - 1;

	/** 첫 단계에서만 스와이프로 뒤로 가기 허용 */
	useEffect(() => {
		navigation.setOptions({ gestureEnabled: index === 0 });
	}, [index, navigation]);

	/** 안드로이드 뒤로 가기 버튼으로 이전 단계 이동 */
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

	const handleNext = () => {
		if (isLastStep) {
			actions.onFinish();

			return;
		}

		setIndex(index + 1);
	};

	const handleBack = index > 0 ? () => setIndex(index - 1) : actions.onBack;

	return (
		<Screen scrollable={false}>
			<View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
				{/*헤더*/}
				<View style={styles.topRow}>
					{handleBack && <IconButton icon={ChevronLeftIcon} label={t('common.back')} onPress={handleBack} />}
					<PageDots
						count={steps.length}
						currentIndex={index}
						label={t('common.stepProgress', { current: index + 1, total: steps.length })}
					/>
					<View style={styles.spacer} />
					{actions.onSkip && <TextButton label={t('common.skip')} variant="muted" onPress={actions.onSkip} />}
				</View>

				{/*현재 단계 안내*/}
				<View style={styles.stepContainer}>
					<BuddySays message={step.title} />
					<Illustration scene={step.scene} icon={step.icon} height={260} showMascot={false} />
				</View>

				{/*footer*/}
				<View style={styles.bottomContainer}>
					{dontShowAgain && (
						<ItemCheckbox
							first
							label={t('common.dontShowAgain')}
							checked={dontShowAgain.value}
							onToggle={() => dontShowAgain.onChange(!dontShowAgain.value)}
						/>
					)}
					<Button
						label={isLastStep ? (finishLabel ?? t('common.start')) : t('common.next')}
						onPress={handleNext}
					/>
				</View>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	topRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 4 },
	spacer: { flex: 1 },
	stepContainer: { flex: 1, justifyContent: 'space-between', gap: 24, paddingTop: 16, paddingBottom: 24 },
	bottomContainer: { gap: 12 },
});

export default GuidePager;
