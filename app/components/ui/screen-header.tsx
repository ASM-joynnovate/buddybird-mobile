import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChevronLeftIcon } from 'lucide-react-native';

import { IconButton } from '@/components/ui/icon-button';
import { Title } from '@/components/ui/title';

interface Props {
	title?: string;
	onBack?: () => void;
	backVariant?: 'plain' | 'onBrand';
	trailing?: ReactNode;
	large?: boolean;
}

export const ScreenHeader = ({ title, onBack, backVariant = 'plain', trailing, large = false }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<View style={styles.headerRow}>
				{onBack && (
					<IconButton
						icon={ChevronLeftIcon}
						label={t('common.back')}
						variant={backVariant}
						onPress={onBack}
					/>
				)}
				{title ? (
					<Title style={[styles.title, !large && styles.compact]}>{title}</Title>
				) : (
					<View style={styles.spacer} />
				)}
				<View style={styles.trailingRow}>{trailing}</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { marginBottom: 8 },
	headerRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 4 },
	title: { flex: 1, minWidth: 0 },
	compact: { fontSize: 20, lineHeight: 26 },
	spacer: { flex: 1 },
	trailingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
