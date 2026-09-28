import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChevronLeftIcon, XIcon } from 'lucide-react-native';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';

const backIcons = { back: ChevronLeftIcon, close: XIcon };

interface Props {
	title?: string;
	onBack?(): void;
	backIcon?: 'back' | 'close';
	trailing?: ReactNode;
	large?: boolean;
}

export function ScreenHeader({ title, onBack, backIcon = 'back', trailing, large = false }: Props) {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				{onBack ? (
					<IconButton
						icon={backIcons[backIcon]}
						label={t(backIcon === 'close' ? 'common.close' : 'common.back')}
						onPress={onBack}
					/>
				) : null}
				{title ? (
					<Title style={[styles.title, !large && styles.compact]}>{title}</Title>
				) : (
					<View style={styles.spacer} />
				)}
				<View style={styles.right}>{trailing}</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { marginBottom: 8 },
	header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 4 },
	title: { flex: 1, minWidth: 0 },
	compact: { fontSize: 20, lineHeight: 26 },
	spacer: { flex: 1 },
	right: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
