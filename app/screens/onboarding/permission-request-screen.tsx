import { useCallback, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { useUpdatePushToken } from '@/hooks/apis/devices';
import { getSettingsOptions } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon, LockIcon, type LucideIcon, MicIcon } from 'lucide-react-native';

import { type PermissionKind, readPermission, requestPermission } from '@/services/device/permissions';
import { readPushToken } from '@/services/push/registration';
import { reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
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

/** 권한을 요청하고 허용 여부를 반환하는 함수 */
const askPermission = async (kind: PermissionKind) => {
	try {
		return (await requestPermission(kind)).granted;
	} catch (e) {
		reportError(e, `permission_request_${kind}`);

		return false;
	}
};

/** 현재 권한 허용 여부를 반환하는 함수 */
const isGranted = async (kind: PermissionKind) => {
	try {
		return (await readPermission(kind)).granted;
	} catch (e) {
		reportError(e, `permission_read_${kind}`);

		return false;
	}
};

/** 권한 요청 화면 */
const PermissionRequestScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	usePrefetchQuery(getSettingsOptions());

	const { mutate } = useUpdatePushToken();

	const [busy, setBusy] = useState(false);

	/** 화면 진입 시 onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('permissions');
		}, []),
	);

	/** 권한 단계를 끝내는 함수 */
	const completePermissionStep = (microphoneGranted: boolean, notificationsGranted: boolean) => {
		trackOnboardingStepCompleted('permissions', {
			microphone_granted: microphoneGranted,
			notifications_granted: notificationsGranted,
		});

		navigation.navigate('MarketingNotification');
	};

	const handleAllow = async () => {
		if (busy) {
			return;
		}

		setBusy(true);

		const microphoneGranted = await askPermission('microphone');
		const notificationsGranted = await askPermission('notifications');

		if (notificationsGranted) {
			void readPushToken()
				.then((token) => {
					if (token) {
						mutate({ data: { token } }, { onError: (error) => reportError(error, 'push_token_register') });
					}
				})
				.catch((error) => reportError(error, 'push_token_register'));
		}

		setBusy(false);

		completePermissionStep(microphoneGranted, notificationsGranted);
	};

	const handleLater = async () => {
		completePermissionStep(await isGranted('microphone'), await isGranted('notifications'));
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
			<ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

			<View style={styles.introContainer}>
				<BuddySays message={t('onboarding.permissions.intro')} />
				<Illustration
					scene={t('onboarding.permissions.scene')}
					icon={LockIcon}
					height={180}
					showMascot={false}
				/>
			</View>

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
