import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import type { HomeStackParamList, RootStackParamList } from '@/types/navigation';

import { devicesQueryOptions } from '@/hooks/apis/devices';
import { homeSummaryQueryOptions } from '@/hooks/apis/home';
import { finishSessionMutationOptions } from '@/hooks/apis/sessions';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';
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
import { useSessionDraft } from '@/screens/home/hooks/use-session-draft';
import { useStartSession } from '@/screens/home/hooks/use-start-session';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { contentMaxWidth, font } from '@/theme';

import { PermissionDialog } from '@/components/dialogs/permission-dialog';
import { SleepTimePicker } from '@/components/session/sleep-time-picker';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { GroupedList } from '@/components/ui/grouped-list';
import { GroupedListPickerItem } from '@/components/ui/grouped-list/picker-item';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/surface';
import { Copy } from '@/components/ui/text';
import { TextButton } from '@/components/ui/text-button';

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, 'Home'>,
	NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<Navigation>();
	const focused = useIsFocused();

	const locale = useDeviceSettingsStore((state) => state.locale);
	const clientDeviceId = useAccountStore((state) => state.clientDeviceId);

	const summary = useQuery({
		...homeSummaryQueryOptions(),
		refetchInterval: focused ? SCREEN_REFRESH_MS : false,
	});
	const devices = useQuery(devicesQueryOptions());

	const finishing = useIdempotentMutation(finishSessionMutationOptions());

	const setup = useSessionDraft();

	const popup = useNoticePopup(summary.data?.unread_notices);

	const microphone = usePermission('microphone');

	const player = useSoundPlayer();

	const starter = useStartSession((sessionId, draft, endsAt) => {
		setup.resetDraft();

		navigation.navigate('SessionRun', {
			sessionId,
			wordId: draft.wordId,
			endsAt,
			sleep: draft.sleep,
			duration: draft.duration,
			sleepChanged: draft.sleepChanged,
		});
	});

	const running = summary.data?.running_session ?? null;
	const station = devices.data?.find((device) => device.id === running?.station.device_id);
	const runningElsewhere = station !== undefined && station.client_device_id !== clientDeviceId;
	const unread = summary.data?.unread_notification_count ?? 0;

	function start() {
		const draft = setup.draft;

		if (!draft) {
			return;
		}

		player.stop();

		void microphone.run(() => starter.start(draft));
	}

	function wordSheet(close: () => void) {
		if (setup.loading) {
			return <Skeleton rows={3} />;
		}

		if (setup.words.length === 0) {
			return (
				<EmptyState
					message={t('session.start.empty')}
					action={{
						label: t('session.start.addWord'),
						onPress: () => {
							close();

							navigation.navigate('Main', {
								screen: 'WordsTab',
								params: { screen: 'WordEditor' },
							});
						},
					}}
				/>
			);
		}

		return (
			<WordPicker
				words={setup.words}
				selectedId={setup.word?.id ?? null}
				player={player}
				onSelect={(id) => {
					setup.selectWord(id);

					close();
				}}
			/>
		);
	}

	return (
		<Screen scroll={false}>
			<View style={styles.screen}>
				<View style={styles.top}>
					<IconButton
						icon={SettingsIcon}
						label={t('home.settings')}
						onPress={() => navigation.navigate('Settings')}
					/>
					<IconButton
						icon={BellIcon}
						label={unread > 0 ? t('home.notificationsUnread', { count: unread }) : t('home.notifications')}
						onPress={() => navigation.navigate('Notifications')}
					/>
				</View>
				<View style={styles.body}>
					{summary.isError || setup.isError ? (
						<ScreenError
							message={t('common.loadError')}
							onRetry={() => {
								void summary.refetch();
								setup.retry();
							}}
						/>
					) : null}
					{running && runningElsewhere ? (
						<Card contentStyle={styles.elsewhere}>
							<Copy style={styles.elsewhereText}>{t('session.start.elsewhere')}</Copy>
							<TextButton
								label={t('session.start.endElsewhere')}
								disabled={finishing.isPending}
								onPress={() => finishing.mutate({ id: running.id })}
							/>
							<InlineError message={finishing.isError ? t('session.end.error') : null} />
						</Card>
					) : null}
					<GroupedList>
						<GroupedListPickerItem
							item={{
								first: true,
								icon: MessageSquareTextIcon,
								label: t('session.start.word'),
								value: setup.word?.name ?? t('session.start.choose'),
							}}
							sheet={{ title: t('session.start.word'), list: true }}
						>
							{wordSheet}
						</GroupedListPickerItem>
						<GroupedListPickerItem
							item={{
								icon: ClockIcon,
								label: t('session.start.duration'),
								value:
									setup.duration.ms === null
										? t('session.start.untilEnd')
										: formatDurationWithDays(setup.duration.ms, locale),
							}}
							sheet={{ title: t('session.start.duration') }}
						>
							{() => <DurationPicker value={setup.duration} onChange={setup.setDuration} />}
						</GroupedListPickerItem>
						<SleepTimePicker value={setup.sleep} onChange={setup.setEditedSleep} />
					</GroupedList>
				</View>
				<Button
					label={t('common.start')}
					icon={PlayIcon}
					loading={starter.busy}
					disabled={!setup.draft}
					onPress={start}
				/>
			</View>
			<StartDialogs state={starter} />
			<PermissionDialog state={microphone.dialog} />
			<NoticePopup
				notice={focused ? popup.current : null}
				onClose={popup.close}
				onDetail={(noticeId) => {
					popup.close();

					navigation.navigate('NoticeDetail', { noticeId });
				}}
			/>
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
		paddingTop: 8,
		paddingBottom: 16,
		gap: 16,
	},
	top: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
	body: { flex: 1, minHeight: 0, gap: 12 },
	elsewhere: { gap: 8, padding: 16 },
	elsewhereText: { fontFamily: font.extraBold, fontSize: 15 },
});
