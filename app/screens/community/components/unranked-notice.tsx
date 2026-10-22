import { ActivityIndicator, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useUpdateCommunitySettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClockIcon, EyeOffIcon, GlobeIcon, LogInIcon, UserPenIcon } from 'lucide-react-native';

import { useMessageStore } from '@/stores/message';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const reasonIcons = {
	not_participating: EyeOffIcon,
	no_nickname: UserPenIcon,
	anonymous: LogInIcon,
	country_mismatch: GlobeIcon,
	no_record: ClockIcon,
};

type UnrankedReason = keyof typeof reasonIcons;

interface Props {
	reason: string | null;
	style?: StyleProp<ViewStyle>;
}

/**
 * 순위 제외 이유 컴포넌트
 * @param reason 서버가 준 순위 제외 이유
 * @param style 바깥 여백
 */
const UnrankedNotice = ({ reason, style }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { isPending, mutate } = useUpdateCommunitySettings();

	const openPopup = useMessageStore((state) => state.openPopup);

	if (!reason || !Object.hasOwn(reasonIcons, reason)) {
		return null;
	}

	const unrankedReason = reason as UnrankedReason;
	const ReasonIcon = reasonIcons[unrankedReason];

	const handleJoinLeaderboard = () => {
		if (isPending) {
			return;
		}

		mutate(
			{ data: { leaderboard_enabled: true } },
			{ onError: (error) => openPopup({ title: apiErrorMessage(error, t) }) },
		);
	};

	const unrankedActions = {
		not_participating: {
			label: t('community.leaderboard.unranked.not_participating.action'),
			onPress: handleJoinLeaderboard,
		},
		no_nickname: {
			label: t('community.leaderboard.unranked.no_nickname.action'),
			onPress: () => navigation.navigate('Main', { screen: 'ProfileTab', params: { screen: 'AccountEditor' } }),
		},
		anonymous: {
			label: t('community.leaderboard.unranked.anonymous.action'),
			onPress: () => navigation.navigate('Login'),
		},
	};
	const unrankedAction = Object.hasOwn(unrankedActions, unrankedReason)
		? unrankedActions[unrankedReason as keyof typeof unrankedActions]
		: null;

	return (
		<View style={[styles.container, style]}>
			<View style={styles.iconCircle}>
				<ReasonIcon size={18} color={colors.muted} />
			</View>

			<View style={styles.textContainer}>
				<Copy style={styles.title}>{t(`community.leaderboard.unranked.${unrankedReason}.title`)}</Copy>
				<Copy style={styles.description}>
					{t(`community.leaderboard.unranked.${unrankedReason}.description`)}
				</Copy>
			</View>

			{unrankedAction && (
				<PressableSurface
					accessibilityLabel={unrankedAction.label}
					accessibilityState={{ busy: isPending }}
					disabled={isPending}
					onPress={unrankedAction.onPress}
					variant="primary"
					depth="low"
					cornerRadius="tile"
					contentStyle={styles.actionButton}
				>
					{isPending ? (
						<ActivityIndicator color={colors.onFilled} />
					) : (
						<Copy style={styles.actionLabel}>{unrankedAction.label}</Copy>
					)}
				</PressableSurface>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 10,
		paddingLeft: 12,
		paddingRight: 10,
		borderRadius: radius.tile,
		backgroundColor: colors.surface,
	},
	iconCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.background,
	},
	textContainer: { flex: 1, minWidth: 0, gap: 1 },
	title: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 19, color: colors.muted },
	description: { fontFamily: font.bold, fontSize: 12, lineHeight: 16, color: colors.subtle },
	actionButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 0 },
	actionLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.onFilled },
});

export default UnrankedNotice;
