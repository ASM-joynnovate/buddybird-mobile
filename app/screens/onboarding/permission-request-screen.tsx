import { useCallback, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BellIcon, LockIcon, type LucideIcon, MicIcon } from 'lucide-react-native';

import { type PermissionKind, readPermission, requestPermission } from '@/services/device/permissions';
import { sendPushToken } from '@/services/push/registration';
import { reportError } from '@/services/telemetry/client';
import {
	trackOnboardingCompleted,
	trackOnboardingStepCompleted,
	trackOnboardingStepViewed,
} from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import BuddySays from '@/components/buddy-says';
import Illustration from '@/components/illustration';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextButton } from '@/components/ui/text-button';

const PERMISSIONS: readonly { kind: 'microphone' | 'notifications'; icon: LucideIcon }[] = [
	{ kind: 'microphone', icon: MicIcon },
	{ kind: 'notifications', icon: BellIcon },
];

/** 권한 요청 뒤 허용 여부 */
const askPermission = async (kind: PermissionKind) => {
	try {
		return (await requestPermission(kind)).granted;
	} catch (e) {
		reportError(e, `permission_request_${kind}`);

		return false;
	}
};

/** 지금 권한 허용 여부 */
const isGranted = async (kind: PermissionKind) => {
	try {
		return (await readPermission(kind)).granted;
	} catch (e) {
		reportError(e, `permission_read_${kind}`);

		return false;
	}
};

/** 마이크와 알림 권한의 쓰임을 보여 주고 허용하기를 누르면 권한을 요청한 뒤, 나중에를 누르면 바로 온보딩을 마치는 화면 */
const PermissionRequestScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();

	const [busy, setBusy] = useState(false);

	const setOnboardingCompleted = useDeviceSettingsStore((state) => state.setOnboardingCompleted);

	/** 화면에 들어올 때마다 onboarding_step_viewed 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('permissions');
		}, []),
	);

	/** 권한 단계와 온보딩 완료 전송, 온보딩 완료 저장 */
	const finishOnboarding = (microphoneGranted: boolean, notificationsGranted: boolean) => {
		trackOnboardingStepCompleted('permissions', {
			microphone_granted: microphoneGranted,
			notifications_granted: notificationsGranted,
		});
		trackOnboardingCompleted();

		try {
			setOnboardingCompleted(true);
		} catch (e) {
			reportError(e, 'onboarding_completed_save');
		}
	};

	/** 마이크와 알림 권한 요청, 알림 허용 시 푸시 토큰 등록, 온보딩 완료 */
	const handleAllow = async () => {
		if (busy) {
			return;
		}

		setBusy(true);

		const microphoneGranted = await askPermission('microphone');
		const notificationsGranted = await askPermission('notifications');

		if (notificationsGranted) {
			void sendPushToken().catch((error) => reportError(error, 'push_token_register'));
		}

		setBusy(false);

		finishOnboarding(microphoneGranted, notificationsGranted);
	};

	/** 지금 권한 상태로 온보딩 완료 */
	const handleLater = async () => {
		finishOnboarding(await isGranted('microphone'), await isGranted('notifications'));
	};

	return (
		<Screen
			footer={
				<>
					<View style={styles.laterContainer}>
						<TextButton
							label={t('onboarding.permissions.later')}
							variant="muted"
							disabled={busy}
							onPress={() => void handleLater()}
						/>
					</View>
					<Button
						label={t('onboarding.permissions.allow')}
						loading={busy}
						onPress={() => void handleAllow()}
					/>
				</>
			}
		>
			{/*뒤로 가기 버튼*/}
			<ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

			{/*안내 말풍선과 그림*/}
			<View style={styles.introContainer}>
				<BuddySays message={t('onboarding.permissions.intro')} />
				<Illustration
					scene={t('onboarding.permissions.scene')}
					icon={LockIcon}
					height={180}
					showMascot={false}
				/>
			</View>

			{/*권한 목록*/}
			<ItemGroup>
				{PERMISSIONS.map(({ kind, icon: Icon }, index) => (
					<View key={kind} style={[styles.permissionRow, index > 0 && styles.divider]}>
						<Icon size={24} color={colors.orangeDark} />
						<View style={styles.textContainer}>
							<Copy style={styles.name}>{t(`common.permission.${kind}.name`)}</Copy>
							<Copy style={styles.purpose}>{t(`onboarding.permissions.purpose.${kind}`)}</Copy>
						</View>
					</View>
				))}
			</ItemGroup>
		</Screen>
	);
};

const styles = StyleSheet.create({
	introContainer: { flexGrow: 1, gap: 24, paddingBottom: 28 },
	permissionRow: {
		minHeight: 64,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	textContainer: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.extraBold, fontSize: 16 },
	purpose: { fontSize: 13, color: colors.muted },
	laterContainer: { alignItems: 'flex-end' },
});

export default PermissionRequestScreen;
