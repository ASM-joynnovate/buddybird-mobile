import { StyleSheet } from 'react-native';

import { Surface, type SurfaceProps } from '@/components/ui/surface';

interface Props extends SurfaceProps {}

export const Card = ({ contentStyle, ...props }: Props) => {
	return <Surface depth="low" {...props} contentStyle={[styles.card, contentStyle]} />;
};

const styles = StyleSheet.create({
	card: { padding: 16 },
});
