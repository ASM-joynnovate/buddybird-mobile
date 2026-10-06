import { useState } from 'react';

import { ScrollView, StyleSheet, View } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import type { RootStackParamList, SessionSetup } from '@/types/navigation';

import { useGetDeviceList } from '@/hooks/apis/devices';
import { getHomeSummaryOptions } from '@/hooks/apis/home';
import { useFinishRunningSession, useFinishSession, useStartSession } from '@/hooks/apis/sessions';
import { useGetSettings } from '@/hooks/apis/settings';
import { useGetWordList } from '@/hooks/apis/words';
import usePermission from '@/hooks/use-permission';
import useRefreshOnFocus from '@/hooks/use-refresh-on-focus';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { MonitorSmartphoneIcon, PlayIcon } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { VolumeManager } from 'react-native-volume-manager';

import AnnouncementPopup from '@/screens/home/components/announcement-popup';
import DurationBreakdown from '@/screens/home/components/duration-breakdown';
import DurationPicker from '@/screens/home/components/duration-picker';
import HomeTopBar from '@/screens/home/components/home-top-bar';
import WordPicker from '@/screens/home/components/word-picker';
import { useAccountStore } from '@/stores/account';
import { useSessionStore } from '@/stores/session';
import { colors, font, layoutAnimationMs } from '@/theme';
import { uploadedRecordings } from '@/utils/uploaded-recordings';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import PermissionDialog from '@/components/dialogs/permission-dialog';
import SleepTimePicker from '@/components/session/sleep-time-picker';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';
import { Card } from '@/components/ui/surface/card';
import { TextButton } from '@/components/ui/text-button';

/**
 * 학습 설정 컴포넌트
 */
const HomeContent = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [requestedSetup, setRequestedSetup] = useState<SessionSetup | null>(null);
	const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);
	const [volumeChecking, setVolumeChecking] = useState(false);
	const [lowVolumeDialogOpen, setLowVolumeDialogOpen] = useState(false);

	const { data: homeSummaryData, refetch: refetchHomeSummary } = useSuspenseQuery(getHomeSummaryOptions());
	const { data: deviceListData } = useGetDeviceList();
	const { data: wordListData } = useGetWordList();
	const { data: settingsData } = useGetSettings();

	useRefreshOnFocus(refetchHomeSummary);

	const startSession = useStartSession();
	const finishSession = useFinishSession();
	const finishRunningSession = useFinishRunningSession();

	const clientDeviceId = useAccountStore((state) => state.clientDeviceId);

	const selectedWordId = useSessionStore((state) => state.selectedWordId);
	const duration = useSessionStore((state) => state.duration);
	const editedSleep = useSessionStore((state) => state.editedSleep);
	const setSelectedWordId = useSessionStore((state) => state.setSelectedWordId);
	const setDuration = useSessionStore((state) => state.setDuration);
	const setEditedSleep = useSessionStore((state) => state.setEditedSleep);
	const resetSetup = useSessionStore((state) => state.resetSetup);

	const microphonePermission = usePermission('microphone');

	const runningSession = homeSummaryData.running_session;
	const runningDevice = deviceListData.find((device) => device.id === runningSession?.station.device_id);
	const runningElsewhere = runningDevice !== undefined && runningDevice.client_device_id !== clientDeviceId;
	const unreadCount = homeSummaryData.unread_notification_count;

	const wordsWithRecordings = wordListData.filter((word) => uploadedRecordings(word.recordings).length > 0);
	const selectedWord =
		wordsWithRecordings.find((word) => word.id === selectedWordId) ?? wordsWithRecordings[0] ?? null;
	const untilEnd = duration.ms === null;
	const durationInvalid = duration.ms === 0;
	const sleep = editedSleep ?? settingsData.sleep;
	const sleepChanged =
		untilEnd &&
		editedSleep !== null &&
		(editedSleep.sleep_at !== settingsData.sleep.sleep_at || editedSleep.wake_at !== settingsData.sleep.wake_at);
	const sessionSetup =
		selectedWord && !durationInvalid
			? { wordId: selectedWord.id, duration, sleep: untilEnd ? sleep : null, sleepChanged }
			: null;

	const starting =
		volumeChecking ||
		microphonePermission.checking ||
		startSession.isPending ||
		finishSession.isPending ||
		finishRunningSession.isPending;
	const startFailed =
		requestedSetup !== null && (startSession.isError || finishSession.isError || finishRunningSession.isError);

	/** 학습 시작 요청 함수 */
	const requestStart = (setupToStart: SessionSetup) => {
		const endsAt = setupToStart.duration.ms === null ? null : dayjs().add(setupToStart.duration.ms, 'ms').valueOf();

		setRequestedSetup(setupToStart);
		setTakeoverDialogOpen(false);

		startSession.mutate(
			{
				data: {
					word_id: setupToStart.wordId,
					ends_at: endsAt === null ? null : dayjs(endsAt).toISOString(),
					sleep: setupToStart.sleep,
				},
			},
			{
				onSuccess: (session) => {
					setRequestedSetup(null);

					resetSetup();

					navigation.navigate('SessionRun', {
						sessionId: session.id,
						wordId: setupToStart.wordId,
						endsAt,
						sleep: setupToStart.sleep,
						duration: setupToStart.duration,
						sleepChanged: setupToStart.sleepChanged,
					});
				},
				onError: (error) => {
					if (error instanceof ApiError && error.code === 'SESSION__ALREADY_RUNNING') {
						startSession.reset();

						setTakeoverDialogOpen(true);
					}
				},
			},
		);
	};

	const handleStart = async () => {
		if (starting || !sessionSetup) {
			return;
		}

		setVolumeChecking(true);

		try {
			const { volume } = await VolumeManager.getVolume();

			if (volume === 0) {
				setLowVolumeDialogOpen(true);

				return;
			}

			void microphonePermission.run(() => requestStart(sessionSetup));
		} finally {
			setVolumeChecking(false);
		}
	};

	/** 음량이 0인 채로 학습 시작 */
	const handleConfirmLowVolume = () => {
		if (starting || !sessionSetup) {
			return;
		}

		setLowVolumeDialogOpen(false);

		void microphonePermission.run(() => requestStart(sessionSetup));
	};

	const handleCloseLowVolumeDialog = () => {
		setLowVolumeDialogOpen(false);
	};

	/** 다른 기기에서 진행 중인 학습을 이 기기로 가져오기 */
	const handleConfirmTakeover = () => {
		if (starting || !requestedSetup) {
			return;
		}

		setTakeoverDialogOpen(false);

		finishRunningSession.mutate({}, { onSuccess: () => requestStart(requestedSetup) });
	};

	const handleRetryStart = () => {
		if (starting || !requestedSetup) {
			return;
		}

		finishSession.reset();
		finishRunningSession.reset();

		requestStart(requestedSetup);
	};

	const handleCloseStartDialog = () => {
		setTakeoverDialogOpen(false);
		setRequestedSetup(null);

		startSession.reset();
		finishSession.reset();
		finishRunningSession.reset();
	};

	const handleEndElsewhere = () => {
		if (starting || !runningSession) {
			return;
		}

		finishSession.mutate({ id: runningSession.id });
	};

	return (
		<>
			<HomeTopBar unreadCount={unreadCount} />

			<ScrollView
				alwaysBounceVertical={false}
				showsVerticalScrollIndicator={false}
				style={styles.body}
				contentContainerStyle={styles.content}
			>
				<ScreenHeader large title={t('session.start.title')} />

				{/*다른 기기에서 진행 중인 학습 안내*/}
				{runningSession && runningElsewhere && (
					<View style={styles.elsewhereContainer}>
						<Card contentStyle={styles.elsewhereCard}>
							<MonitorSmartphoneIcon size={20} color={colors.orangeDark} />
							<Copy style={styles.elsewhereText}>{t('session.start.elsewhere')}</Copy>
							<TextButton
								label={t('session.start.endElsewhere')}
								disabled={starting}
								onPress={handleEndElsewhere}
							/>
						</Card>
						<InlineError message={finishSession.isError ? t('session.start.endElsewhereError') : null} />
					</View>
				)}

				{/*단어 선택*/}
				<Copy accessibilityRole="header" style={ui.sectionTitle}>
					{t('session.start.word')}
				</Copy>
				<WordPicker
					words={wordsWithRecordings}
					selectedId={selectedWord?.id ?? null}
					onSelect={setSelectedWordId}
				/>
				{!selectedWord && <Copy style={ui.subtitle}>{t('session.start.empty')}</Copy>}

				{/*학습 시간 선택*/}
				<Copy accessibilityRole="header" style={[ui.sectionTitle, ui.sectionContainer]}>
					{t('session.start.duration')}
				</Copy>
				<DurationPicker value={duration} onChange={setDuration} />
				{!durationInvalid && (
					<Animated.View
						entering={FadeIn.duration(layoutAnimationMs)}
						exiting={FadeOut.duration(layoutAnimationMs)}
						layout={LinearTransition.duration(layoutAnimationMs)}
					>
						<DurationBreakdown duration={duration} />
					</Animated.View>
				)}

				{/*수면 시간 선택*/}
				{untilEnd && (
					<Animated.View
						entering={FadeIn.duration(layoutAnimationMs)}
						exiting={FadeOut.duration(layoutAnimationMs)}
						layout={LinearTransition.duration(layoutAnimationMs)}
						style={styles.sleepContainer}
					>
						<ItemGroup>
							<SleepTimePicker first value={sleep} onChange={setEditedSleep} />
						</ItemGroup>
					</Animated.View>
				)}

				{/*학습 시간 오류*/}
				<Animated.View layout={LinearTransition.duration(layoutAnimationMs)}>
					<InlineError message={durationInvalid ? t('session.start.invalid') : null} />
				</Animated.View>
			</ScrollView>

			<Button
				label={t('session.start.startButton')}
				accessibilityLabel={sessionSetup ? t('session.start.startButton') : t('session.start.startUnavailable')}
				icon={PlayIcon}
				iconProps={{ fill: sessionSetup ? colors.onFilled : colors.subtle }}
				depth="xhigh"
				loading={starting}
				disabled={!sessionSetup}
				onPress={() => void handleStart()}
				style={styles.startButton}
			/>

			{/*학습 시작 확인 다이얼로그*/}
			<ConfirmDialog
				visible={lowVolumeDialogOpen}
				text={{
					title: t('session.lowVolume.title'),
					message: t('session.lowVolume.message'),
					confirm: t('session.lowVolume.confirm'),
				}}
				onConfirm={handleConfirmLowVolume}
				onClose={handleCloseLowVolumeDialog}
			/>
			<ConfirmDialog
				visible={takeoverDialogOpen}
				text={{
					title: t('session.takeover.title'),
					message: t('session.takeover.message'),
					confirm: t('session.takeover.confirm'),
				}}
				confirmStatus={{ busy: starting }}
				onConfirm={handleConfirmTakeover}
				onClose={handleCloseStartDialog}
			/>
			<ConfirmDialog
				visible={startFailed}
				text={{
					title: t('session.startError.title'),
					message: t('session.startError.message'),
					confirm: t('common.retry'),
					cancel: t('common.close'),
				}}
				confirmStatus={{ busy: starting }}
				onConfirm={handleRetryStart}
				onClose={handleCloseStartDialog}
			/>
			<PermissionDialog state={microphonePermission.dialog} />

			<AnnouncementPopup announcements={homeSummaryData.unread_announcements} />
		</>
	);
};

const styles = StyleSheet.create({
	body: { flex: 1 },
	content: { paddingTop: 8, paddingBottom: 24 },
	elsewhereContainer: { marginBottom: 20 },
	elsewhereCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 4, paddingLeft: 14 },
	elsewhereText: { flex: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 15, lineHeight: 21 },
	sleepContainer: { marginTop: 16 },
	startButton: { marginTop: 12 },
});

export default HomeContent;
