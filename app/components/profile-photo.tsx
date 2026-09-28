import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { usePhotoPicker } from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import { ImageIcon, PencilIcon, PlusIcon } from 'lucide-react-native';

import { colors } from '@/theme';

import { Avatar } from '@/components/ui/avatar';
import { InlineError } from '@/components/ui/inline-error';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { Sheet } from '@/components/ui/sheet';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const actionIcons = { plus: PlusIcon, edit: PencilIcon };

interface Props {
	photo: ReturnType<typeof usePhotoPicker>;
	busy: boolean;
	action?: 'plus' | 'edit';
}

export function ProfilePhoto({ photo, busy, action = 'edit' }: Props) {
	const { t } = useTranslation();

	const [sheetOpen, setSheetOpen] = useState(false);

	const ActionIcon = actionIcons[action];

	return (
		<View style={styles.photoArea}>
			<PressableSurface
				accessibilityLabel={t('common.profilePhoto.select')}
				disabled={busy}
				onPress={() => setSheetOpen(true)}
				cornerRadius="pill"
				depth="none"
			>
				<Avatar uri={photo.photoUri} icon={ImageIcon} size="xlarge" />
				<View style={styles.photoBadge}>
					<ActionIcon size={20} color={colors.onFilled} />
				</View>
			</PressableSurface>
			<InlineError message={photo.errorMessage} />
			<Sheet visible={sheetOpen} title={t('common.profilePhoto.title')} onClose={() => setSheetOpen(false)}>
				<ItemGroup>
					<Item
						first
						label={t('common.profilePhoto.take')}
						onPress={() => {
							setSheetOpen(false);

							void photo.take();
						}}
					/>
					<Item
						label={t('common.profilePhoto.choose')}
						onPress={() => {
							setSheetOpen(false);

							void photo.choose();
						}}
					/>
				</ItemGroup>
			</Sheet>
		</View>
	);
}

const styles = StyleSheet.create({
	photoArea: { alignItems: 'center', marginBottom: 20, gap: 10 },
	photoBadge: {
		position: 'absolute',
		right: -2,
		bottom: -2,
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: colors.orange,
		borderWidth: 3,
		borderColor: colors.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
