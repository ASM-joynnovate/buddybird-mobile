import { PropsWithChildren } from "react"
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  ViewStyle,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { colors, font } from "@/theme"
import { Icon, IconName } from "@/components/Icon"

export function Copy({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.copy, style]} />
}

export function Title({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  return (
    <Copy accessibilityRole="header" style={[styles.title, style]}>
      {children}
    </Copy>
  )
}

export function Screen({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  ...props
}: PropsWithChildren<ScrollViewProps & { scroll?: boolean }>) {
  return (
    <SafeAreaView edges={["top"]} style={[styles.screen, style]}>
      {scroll ? (
        <ScrollView
          {...props}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.content, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  )
}

type ButtonProps = PressableProps & {
  label: string
  icon?: IconName
  variant?: "primary" | "secondary" | "blue"
  loading?: boolean
  compact?: boolean
}

export function Button({
  label,
  icon,
  variant = "primary",
  loading,
  compact,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const inactive = disabled || loading
  let backgroundColor = colors.orange
  let borderColor = colors.orangeDark
  let foregroundColor = "#3c2600"

  if (variant === "secondary") {
    backgroundColor = colors.background
    borderColor = colors.border
    foregroundColor = colors.text
  } else if (variant === "blue") {
    backgroundColor = colors.blue
    borderColor = colors.blueDark
    foregroundColor = "#073c51"
  }

  if (inactive) {
    backgroundColor = colors.border
    borderColor = colors.border
    foregroundColor = colors.muted
  }

  let leadingContent = null

  if (loading) {
    leadingContent = <ActivityIndicator color={foregroundColor} />
  } else if (icon) {
    leadingContent = <Icon name={icon} color={foregroundColor} size={compact ? 20 : 26} />
  }

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        {
          backgroundColor,
          borderColor,
          borderBottomWidth: pressed ? 2 : 6,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {leadingContent}
      <Copy style={[styles.buttonText, { color: foregroundColor }, compact && styles.compactText]}>
        {label}
      </Copy>
    </Pressable>
  )
}

export function Chip({
  label,
  selected,
  onPress,
  testID,
  style,
}: {
  label: string
  selected?: boolean
  onPress(): void
  testID?: string
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selectedChip,
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      <Copy style={[styles.chipText, selected && { color: colors.orangeText }]}>{label}</Copy>
    </Pressable>
  )
}

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.text,
  style,
  testID,
  disabled,
}: {
  icon: IconName
  label: string
  onPress(): void
  color?: string
  style?: StyleProp<ViewStyle>
  testID?: string
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      hitSlop={4}
      style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.65 }, style]}
    >
      <Icon name={icon} color={color} />
    </Pressable>
  )
}

export function InlineError({ message }: { message?: string | null }) {
  if (!message) {
    return null
  }

  return (
    <Copy accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>
      {message}
    </Copy>
  )
}

export const ui = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: {
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.background,
    padding: 16,
  },
  label: { fontSize: 16, fontFamily: font.extraBold, color: colors.muted, marginBottom: 10 },
  input: {
    minHeight: 54,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: font.bold,
    fontSize: 19,
    color: colors.text,
  },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 23, fontFamily: font.black, marginBottom: 14 },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: 24 },
})

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    padding: 22,
    paddingBottom: 30,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  copy: { fontFamily: font.bold, fontSize: 16, color: colors.text },
  title: { fontFamily: font.black, fontSize: 34, lineHeight: 42 },
  button: {
    minHeight: 62,
    borderWidth: 2,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonText: { fontFamily: font.extraBold, fontSize: 20, textAlign: "center", flexShrink: 1 },
  compact: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 15 },
  compactText: { fontSize: 16 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 7,
    backgroundColor: colors.background,
  },
  selectedChip: { borderColor: colors.orangeDark, backgroundColor: colors.orangeSoft },
  chipText: { fontSize: 16, color: colors.muted, fontFamily: font.extraBold },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  error: { color: colors.error, fontSize: 15, lineHeight: 21, marginTop: 10 },
})
