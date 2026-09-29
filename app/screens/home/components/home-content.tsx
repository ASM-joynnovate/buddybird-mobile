import { useState } from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import type { RootStackParamList, SessionSetup } from '@/types/navigation';

import { useGetDeviceList } from '@/hooks/apis/devices';
import { getHomeSummaryOptions } from '@/hooks/apis/home';
import { getRunningSessionOptions, useFinishSession, useStartSession } from '@/hooks/apis/sessions';
import { useGetSettings } from '@/hooks/apis/settings';
import { useGetWordList } from '@/hooks/apis/words';
import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import { queryClient } from '@/lib/query-client';

import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { PlayIcon } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { SCREEN_REFRESH_MS } from '@/config';
import DurationBreakdown from '@/screens/home/components/duration-breakdown';
import DurationPicker from '@/screens/home/components/duration-picker';
import HomeTopBar from '@/screens/home/components/home-top-bar';
import NoticePopup from '@/screens/home/components/notice-popup';
import WordPicker from '@/screens/home/components/word-picker';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useSessionStore } from '@/stores/session';
import { font, layoutAnimationMs } from '@/theme';

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
 * 학습 설정과 학습 시작 컴포넌트
 */
const HomeContent = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const focused = useIsFocused();

	const [requestedSetup, setRequestedSetup] = useState<SessionSetup | null>(null);
	const [takeoverDialogOpen, setTakeoverDialogOpen] = useState(false);

	const { data: homeSummaryData } = useSuspenseQuery({
		...getHomeSummaryOptions(),
		refetchInterval: focused ? SCREEN_REFRESH_MS : false,
	});
	const { data: deviceListData } = useGetDeviceList();
	const { data: wordListData } = useGetWordList();
	const { data: settingsData } = useGetSettings();

	const startSession = useStartSession();
	const finishSession = useFinishSession();

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

	const wordsWithRecordings = wordListData.filter((word) => word.recordings.length > 0);
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

	const starting = startSession.isPending || finishSession.isPending;
	const startFailed = requestedSetup !== null && (startSession.isError || finishSession.isError);

	/** 학습 시작 요청과 학습 화면 이동 */
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

	/** 학습 시작 */
	const handleStart = () => {
		if (starting || !sessionSetup) {
			return;
		}

		void microphonePermission.run(() => requestStart(sessionSetup));
	};

	/** 진행 중 세션 종료 뒤 학습 시작 요청으로 다른 기기의 학습 넘겨받기 */
	const handleConfirmTakeover = async () => {
		if (starting || !requestedSetup) {
			return;
		}

		setTakeoverDialogOpen(false);

		try {
			const latestRunningSession = await queryClient.query({
				...getRunningSessionOptions(),
				staleTime: 0,
			});

			if (latestRunningSession) {
				finishSession.mutate(
					{ id: latestRunningSession.id },
					{ onSuccess: () => requestStart(requestedSetup) },
				);
			} else {
				requestStart(requestedSetup);
			}
		} catch (e) {
			reportError(e, 'session_takeover');
		}
	};

	/** 학습 시작 다시 시도 */
	const handleRetryStart = () => {
		if (starting || !requestedSetup) {
			return;
		}

		finishSession.reset();

		requestStart(requestedSetup);
	};

	/** 학습 시작 다이얼로그 닫기 */
	const handleCloseStartDialog = () => {
		setTakeoverDialogOpen(false);
		setRequestedSetup(null);

		startSession.reset();
		finishSession.reset();
	};

	return (
		<>
			{/*로고 줄*/}
			<HomeTopBar unreadCount={unreadCount} />

			{/*학습 설정*/}
			<ScrollView
				alwaysBounceVertical={false}
				showsVerticalScrollIndicator={false}
				style={styles.body}
				contentContainerStyle={styles.content}
			>
				{/*학습 제목*/}
				<ScreenHeader large title={t('session.start.title')} />

				{/*다른 기기 학습*/}
				{runningSession && runningElsewhere && (
					<Card style={styles.elsewhereCardContainer} contentStyle={styles.elsewhereCard}>
						<Copy style={styles.elsewhereText}>{t('session.start.elsewhere')}</Copy>
						<TextButton
							label={t('session.start.endElsewhere')}
							disabled={finishSession.isPending}
							onPress={() => finishSession.mutate({ id: runningSession.id })}
						/>
						<InlineError message={finishSession.isError ? t('session.start.endElsewhereError') : null} />
					</Card>
				)}

				{/*단어 타일*/}
				<Copy accessibilityRole="header" style={ui.sectionTitle}>
					{t('session.start.word')}
				</Copy>
				<WordPicker
					words={wordsWithRecordings}
					selectedId={selectedWord?.id ?? null}
					onSelect={setSelectedWordId}
				/>
				{!selectedWord && <Copy style={ui.subtitle}>{t('session.start.empty')}</Copy>}

				{/*학습 시간과 합계*/}
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

				{/*수면 시간*/}
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

			{/*학습 시작 버튼*/}
			<Button
				label={t('session.start.startButton')}
				accessibilityLabel={sessionSetup ? t('session.start.startButton') : t('session.start.startUnavailable')}
				icon={PlayIcon}
				depth="xhigh"
				loading={starting}
				disabled={!sessionSetup}
				onPress={handleStart}
				style={styles.startButton}
			/>

			{/*학습 시작 다이얼로그*/}
			<ConfirmDialog
				visible={takeoverDialogOpen}
				text={{
					title: t('session.takeover.title'),
					message: t('session.takeover.message'),
					confirm: t('session.takeover.confirm'),
				}}
				confirmStatus={{ busy: starting }}
				onConfirm={() => void handleConfirmTakeover()}
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

			{/*읽지 않은 공지 다이얼로그*/}
			<NoticePopup notices={homeSummaryData.unread_notices} />
		</>
	);
};

const styles = StyleSheet.create({
	body: { flex: 1 },
	content: { paddingTop: 8, paddingBottom: 24 },
	elsewhereCardContainer: { marginBottom: 20 },
	elsewhereCard: { gap: 8, padding: 16 },
	elsewhereText: { fontFamily: font.extraBold, fontSize: 15 },
	sleepContainer: { marginTop: 16 },
	startButton: { marginTop: 12 },
});

export default HomeContent;
