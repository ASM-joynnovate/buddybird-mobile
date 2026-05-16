import { Platform } from 'react-native';

export const PetHubColors = {
  primary: '#1F3A3D',
  primarySoft: '#2D4A4D',
  secondary: '#2A9D8F',
  secondaryDeep: '#1F7A6E',
  secondaryTint: '#DCEFEB',
  tertiary: '#F4A261',
  tertiaryDeep: '#C97D3F',
  accentCoral: '#E76F51',
  accentCoralDeep: '#C25540',
  neutral: '#FAF6F0',
  neutralDeep: '#F1E9DD',
  surface: '#FFFFFF',
  surfaceWarm: '#FBF6EE',
  feather: '#FCEFD8',
  featherDeep: '#F5DEB6',
  leaf: '#6FAA9C',
  leafDeep: '#4F8A7C',
  darkBg: '#0F1A1B',
  sessionMint: '#7DD3C0',
  kickerMuted: 'rgba(31,58,61,0.55)',
  kickerMutedOnDark: 'rgba(255,255,255,0.55)',
  bodyMuted: 'rgba(31,58,61,0.68)',
  placeholderMuted: 'rgba(31,58,61,0.36)',
  surfaceMuted: 'rgba(31,58,61,0.06)',
  borderMuted: 'rgba(31,58,61,0.20)',
};

export const Colors = {
  light: {
    text: PetHubColors.primary,
    background: PetHubColors.neutral,
    tint: PetHubColors.secondary,
    icon: PetHubColors.primarySoft,
    tabIconDefault: 'rgba(31,58,61,0.48)',
    tabIconSelected: PetHubColors.secondary,
  },
  dark: {
    text: PetHubColors.neutral,
    background: PetHubColors.darkBg,
    tint: PetHubColors.sessionMint,
    icon: PetHubColors.secondaryTint,
    tabIconDefault: 'rgba(250,246,240,0.54)',
    tabIconSelected: PetHubColors.sessionMint,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
    display: 'ui-serif',
    body: 'system-ui',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    display: 'serif',
    body: 'normal',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    display: "Georgia, 'Gowun Batang', 'Times New Roman', serif",
    body: "Pretendard, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
});

export const Spacing = {
  waveformGap: 3,
  micro: 4,
  chipGap: 6,
  tabPaddingY: 8,
  sectionHeadGap: 10,
  cardPaddingSm: 14,
  fieldPaddingX: 16,
  buttonPaddingMd: 18,
  sectionY: 20,
  screenX: 22,
  buttonPaddingLg: 22,
  screenXLg: 24,
  onboardingHeroGap: 36,
  onboardingBottom: 38,
  screenBottomTabs: 120,
};

export const Radii = {
  frequencyBar: 11,
  iconSquare: 12,
  field: 14,
  listItem: 16,
  sectionCard: 18,
  card: 22,
  heroCard: 24,
  bottomTab: 28,
  avatarLg: 60,
  full: 999,
};

export const Typography = {
  onboardingTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  homeGreeting: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: -0.15,
  },
};
