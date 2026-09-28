import { StyleSheet, View } from 'react-native';

import { useSuspenseQuery } from '@tanstack/react-query';

import type { HomeStackParamList, RootStackParamList } from '@/types/navigation';

import { useGetDeviceList } from '@/hooks/apis/devices';
import { getHomeSummaryOptions } from '@/hooks/apis/home';
import { useFinishSession } from '@/hooks/apis/sessions';
import { useGetSettings } from '@/hooks/apis/settings';
import { useGetWordList } from '@/hooks/apis/words';
import { usePermission } from '@/hooks/use-permission';
import { useSoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { formatDurationWithDays } from '@/i18n/format';

import { type CompositeNavigationProp, useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon, ClockIcon, MessageSquareTextIcon, PlayIcon, SettingsIcon } from 'lucide-react-native';

import { SCREEN_REFRESH_MS } from '@/config';
import { DurationPicker } from '@/screens/home/components/duration-picker';
import { NoticePopup } from '@/screens/home/components/notice-popup';
import { StartDialogs } from '@/screens/home/components/start-dialogs';
import { WordPicker } from '@/screens/home/components/word-picker';
import { useNoticePopup } from '@/screens/home/hooks/use-notice-popup';
import { useStartSession } from '@/screens/home/hooks/use-start-session';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useSessionStore } from '@/stores/session';
import { font } from '@/theme';

import { PermissionDialog } from '@/components/dialogs/permission-dialog';
import { SleepTimePicker } from '@/components/session/sleep-time-picker';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { GroupedList } from '@/components/ui/grouped-list';
import { GroupedListPickerItem } from '@/components/ui/grouped-list/picker-item';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { Card } from '@/components/ui/surface';
import { Copy } from '@/components/ui/text';
import { TextButton } from '@/components/ui/text-button';

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, 'Home'>,
	NativeStackNavigationProp<RootStackParamList>
>;

/** 홈 본문 컴포넌트 */
const HomeContent = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<Navigation>();
	const focused = useIsFocused();

	const { data: homeSummaryData } = useSuspenseQuery({
		...getHomeSummaryOptions(),
		refetchInterval: focused ? SCREEN_REFRESH_MS : false,
	});
	const { data: deviceListData } = useGetDeviceList();
	const { data: wordListData } = useGetWordList();
	const { data: settingsData } = useGetSettings();

	const { isError, isPending, mutate } = useFinishSession();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const clientDeviceId = useAccountStore((state) => state.clientDeviceId);

	const selectedWordId = useSessionStore((state) => state.selectedWordId);
	const duration = useSessionStore((state) => state.duration);
	const editedSleep = useSessionStore((state) => state.editedSleep);
	const setSelectedWordId = useSessionStore((state) => state.setSelectedWordId);
	const setDuration = useSessionStore((state) => state.setDuration);
	const setEditedSleep = useSessionStore((state) => state.setEditedSleep);
	const resetSetup = useSessionStore((state) => state.resetSetup);

	const popup = useNoticePopup(homeSummaryData.unread_notices);

	const microphonePermission = usePermission('microphone');

	const player = useSoundPlayer();

	const starter = useStartSession((sessionId, requestedSetup, endsAt) => {
		resetSetup();

		navigation.navigate('SessionRun', {
			sessionId,
			wordId: requestedSetup.wordId,
			endsAt,
			sleep: requestedSetup.sleep,
			duration: requestedSetup.duration,
			sleepChanged: requestedSetup.sleepChanged,
		});
	});

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

	/** 학습 시작 */
	const handleStart = () => {
		if (!sessionSetup) {
			return;
		}

		player.stop();

		void microphonePermission.run(() => starter.start(sessionSetup));
	};

	/** 공지 상세 열기 */
	const handleOpenNoticeDetail = (noticeId: string) => {
		popup.close();

		navigation.navigate('NoticeDetail', { noticeId });
	};

	/** 단어 선택 시트 내용 */
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
			<View style={styles.body}>
				{runningSession && runningElsewhere && (
					<Card contentStyle={styles.elsewhereCard}>
						<Copy style={styles.elsewhereText}>{t('session.start.elsewhere')}</Copy>
						<TextButton
							label={t('session.start.endElsewhere')}
							disabled={isPending}
							onPress={() => mutate({ id: runningSession.id })}
						/>
						<InlineError message={isError ? t('session.end.error') : null} />
					</Card>
				)}

				<GroupedList>
					<GroupedListPickerItem
						item={{
							first: true,
							icon: MessageSquareTextIcon,
							label: t('session.start.word'),
							value: selectedWord?.name ?? t('session.start.choose'),
						}}
						sheet={{ title: t('session.start.word'), list: true }}
					>
						{renderWordSheet}
					</GroupedListPickerItem>
					<GroupedListPickerItem
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
					</GroupedListPickerItem>
					<SleepTimePicker value={sleep} onChange={setEditedSleep} />
				</GroupedList>
			</View>

			{/*시작 버튼*/}
			<Button
				label={t('common.start')}
				icon={PlayIcon}
				loading={starter.busy}
				disabled={!sessionSetup}
				onPress={handleStart}
			/>

			{/*학습 시작 다이얼로그*/}
			<StartDialogs state={starter} />
			<PermissionDialog state={microphonePermission.dialog} />

			{/*공지 팝업*/}
			<NoticePopup
				notice={focused ? popup.current : null}
				onClose={popup.close}
				onDetail={handleOpenNoticeDetail}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	topRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
	body: { flex: 1, minHeight: 0, gap: 12 },
	elsewhereCard: { gap: 8, padding: 16 },
	elsewhereText: { fontFamily: font.extraBold, fontSize: 15 },
});

export default HomeContent;
