import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import type { HomeStackParamList, RootStackParamList, SessionSetup } from '@/types/navigation';

import { useGetDeviceList } from '@/hooks/apis/devices';
import { getHomeSummaryOptions } from '@/hooks/apis/home';
import { getRunningSessionOptions, useFinishSession, useStartSession } from '@/hooks/apis/sessions';
import { useGetSettings } from '@/hooks/apis/settings';
import { useGetWordList } from '@/hooks/apis/words';
import usePermission from '@/hooks/use-permission';
import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { formatDurationWithDays } from '@/i18n/format';

import { queryClient } from '@/lib/query-client';

import { type CompositeNavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import { BellIcon, ClockIcon, MessageSquareTextIcon, PlayIcon, SettingsIcon } from 'lucide-react-native';

import { SCREEN_REFRESH_MS } from '@/config';
import DurationPicker from '@/screens/home/components/duration-picker';
import NoticePopup from '@/screens/home/components/notice-popup';
import WordPicker from '@/screens/home/components/word-picker';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useSessionStore } from '@/stores/session';
import { font } from '@/theme';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import PermissionDialog from '@/components/dialogs/permission-dialog';
import SleepTimePicker from '@/components/session/sleep-time-picker';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemPicker } from '@/components/ui/item/picker';
import { Card } from '@/components/ui/surface/card';
import { TextButton } from '@/components/ui/text-button';

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, 'Home'>,
	NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
	player: SoundPlayer;
}

/**
 * 설정과 알림 버튼, 학습할 단어와 학습 시간과 수면 시간 선택, 학습 시작 버튼을 보여 주고 시작 버튼을 누르면 학습을 시작하는 컴포넌트
 * @param player 단어 시트에서 녹음을 재생하고 멈추는 useSoundPlayer 결과
 */
const HomeContent = ({ player }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<Navigation>();
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

	const locale = useDeviceSettingsStore((state) => state.locale);

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
	const selectedWord = wordsWithRecordings.find((word) => word.id === selectedWordId) ?? null;
	const sleep = editedSleep ?? settingsData.sleep;
	const sleepChanged =
		editedSleep !== null &&
		(editedSleep.sleep_at !== settingsData.sleep.sleep_at || editedSleep.wake_at !== settingsData.sleep.wake_at);
	const sessionSetup = selectedWord ? { wordId: selectedWord.id, duration, sleep, sleepChanged } : null;

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

		player.stop();

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

	/** 녹음이 있는 단어 목록이나 단어가 없을 때 단어 추가 안내 */
	const renderWordSheet = (close: () => void) => {
		/** 단어 추가 화면 열기 */
		const handleAddWord = () => {
			close();

			navigation.navigate('Main', {
				screen: 'WordsTab',
				params: { screen: 'WordEditor' },
			});
		};

		/** 단어 선택 */
		const handleSelectWord = (id: string) => {
			setSelectedWordId(id);

			close();
		};

		if (wordsWithRecordings.length === 0) {
			return (
				<EmptyState
					message={t('session.start.empty')}
					action={{ label: t('session.start.addWord'), onPress: handleAddWord }}
				/>
			);
		}

		return (
			<WordPicker
				words={wordsWithRecordings}
				selectedId={selectedWord?.id ?? null}
				player={player}
				onSelect={handleSelectWord}
			/>
		);
	};

	return (
		<>
			{/*설정과 알림 버튼*/}
			<View style={styles.topRow}>
				<IconButton
					icon={SettingsIcon}
					label={t('home.settings')}
					onPress={() => navigation.navigate('Settings')}
				/>
				<IconButton
					icon={BellIcon}
					label={
						unreadCount > 0
							? t('home.notificationsUnread', { count: unreadCount })
							: t('home.notifications')
					}
					onPress={() => navigation.navigate('Notifications')}
				/>
			</View>

			{/*학습 설정*/}
			<View style={styles.setupContainer}>
				{runningSession && runningElsewhere && (
					<Card contentStyle={styles.elsewhereCard}>
						<Copy style={styles.elsewhereText}>{t('session.start.elsewhere')}</Copy>
						<TextButton
							label={t('session.start.endElsewhere')}
							disabled={finishSession.isPending}
							onPress={() => finishSession.mutate({ id: runningSession.id })}
						/>
						<InlineError message={finishSession.isError ? t('session.start.endElsewhereError') : null} />
					</Card>
				)}

				<ItemGroup>
					<ItemPicker
						item={{
							first: true,
							icon: MessageSquareTextIcon,
							label: t('session.start.word'),
							value: selectedWord?.name ?? t('session.start.choose'),
						}}
						sheet={{ title: t('session.start.word'), listLayout: true }}
					>
						{renderWordSheet}
					</ItemPicker>
					<ItemPicker
						item={{
							icon: ClockIcon,
							label: t('session.start.duration'),
							value:
								duration.ms === null
									? t('session.start.untilEnd')
									: formatDurationWithDays(duration.ms, locale),
						}}
						sheet={{ title: t('session.start.duration') }}
					>
						{() => <DurationPicker value={duration} onChange={setDuration} />}
					</ItemPicker>
					<SleepTimePicker value={sleep} onChange={setEditedSleep} />
				</ItemGroup>
			</View>

			{/*시작 버튼*/}
			<Button
				label={t('common.start')}
				icon={PlayIcon}
				loading={starting}
				disabled={!sessionSetup}
				onPress={handleStart}
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
	topRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
	setupContainer: { flex: 1, minHeight: 0, gap: 12 },
	elsewhereCard: { gap: 8, padding: 16 },
	elsewhereText: { fontFamily: font.extraBold, fontSize: 15 },
});

export default HomeContent;
