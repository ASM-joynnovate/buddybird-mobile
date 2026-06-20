import { StyleSheet, Text, type TextProps } from 'react-native';

import { BuddyBirdColors, Fonts, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'title'
    | 'section'
    | 'value'
    | 'body'
    | 'bodySm'
    | 'label'
    | 'button'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'section' ? styles.section : undefined,
        type === 'value' ? styles.value : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'bodySm' ? styles.bodySm : undefined,
        type === 'label' ? styles.label : undefined,
        type === 'button' ? styles.button : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    ...Typography.body,
  },
  section: {
    ...Typography.section,
  },
  value: {
    ...Typography.value,
  },
  body: {
    ...Typography.body,
  },
  bodySm: {
    ...Typography.bodySmall,
  },
  label: {
    ...Typography.label,
    textTransform: 'uppercase',
  },
  button: {
    ...Typography.button,
    textTransform: 'uppercase',
  },
  defaultSemiBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    fontFamily: Fonts.bodyBold,
    lineHeight: 30,
    fontSize: 16,
    color: BuddyBirdColors.secondaryDeep,
  },
});
