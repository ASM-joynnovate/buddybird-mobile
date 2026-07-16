export const BuddyBirdColors = {
  primary: '#FF9600',
  primaryDeep: '#FF9600',
  primaryHover: '#E88900',
  primaryShadow: '#E07F00',
  primaryPressed: '#E07F00',
  primarySoft: '#FFE8CC',
  onPrimary: '#FFFFFF',
  secondary: '#1CB0F6',
  secondaryDeep: '#1CB0F6',
  secondaryShadow: '#1899D6',
  secondaryPressed: '#1899D6',
  secondaryTint: '#DDF4FF',
  onSecondary: '#FFFFFF',
  tertiary: '#FF9600',
  tertiaryDeep: '#FF9600',
  tertiaryPressed: '#E07F00',
  accentYellow: '#FFC800',
  accentYellowShadow: '#E6A800',
  onYellow: '#3C2A00',
  streak: '#FF9600',
  reward: '#FFC800',
  accentRed: '#FF4B4B',
  accentRedShadow: '#E04343',
  accentCoral: '#FF4B4B',
  accentCoralDeep: '#FF4B4B',
  accentCoralPressed: '#E04343',
  accentPurple: '#CE82FF',
  accentPurpleShadow: '#A85FD6',
  accentPurpleDeep: '#CE82FF',
  accentPurplePressed: '#A85FD6',
  ink: '#3C3C3C',
  inkSoft: '#555555',
  inkMuted: '#777777',
  onDark: '#FFFFFF',
  onDarkMuted: '#FFF4E0',
  onDarkSubtle: '#FFD9A8',
  onColorMuted: '#FFFFFFD9',
  onColorStrong: '#FFFFFFEB',
  ledgeOnColorSoft: '#0000001F',
  neutral: '#FFFFFF',
  neutralDeep: '#F7F7F7',
  canvas: '#FFFFFF',
  surface1: '#F7F7F7',
  surface2: '#EBEBEB',
  surface: '#FFFFFF',
  surfaceDark: '#3C3C3C',
  surfaceDarkRaised: '#555555',
  surfaceDarkMuted: '#777777',
  surfaceBlueDark: '#1CB0F6',
  surfaceAmberDark: '#FF9600',
  surfacePurpleDark: '#CE82FF',
  surfaceWarm: '#F7F7F7',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#F7F7F7',
  border: '#E5E5E5',
  borderDark: '#D4D4D4',
  borderMuted: '#E5E5E5',
  borderStrong: '#D4D4D4',
  feather: '#FFF4B8',
  featherDeep: '#FFC800',
  leaf: '#FF9600',
  leafDeep: '#E07F00',
  darkBg: '#FFFFFF',
  sessionMint: '#FF9600',
  kickerMuted: '#777777',
  kickerMutedOnDark: '#F7F7F7',
  bodyMuted: '#555555',
  placeholderMuted: '#9B9B9B',
  disabledBg: '#EBEBEB',
  disabledFg: '#AFAFAF',
  disabledText: '#AFAFAF',
  stage: '#DDF4FF',
  scrim: '#00000066',
  shineWhite: '#FFFFFF66',
  innerShadowSoft: '#00000014',
  greenTint: '#FFE8CC',
  blueTint: '#DDF4FF',
  yellowTint: '#FFF4B8',
  orangeTint: '#FFE8CC',
  redTint: '#FFE1E1',
  purpleTint: '#F2E1FF',
  gradientLearning: '#FFE8CC',
  gradientRest: '#DDF4FF',
  tabIconMuted: '#777777',
  tabIconMutedOnDark: '#777777',
  splashRed: '#DB030F',
  splashYellow: '#F6AF02',
  splashCream: '#F7F2EA',
  splashEyeWhite: '#FFFFFF',
  splashPupil: '#252525',
  splashFaceMask: '#141414',
  splashBeak: '#2D2D2D',
  splashTongue: '#F33837',
};

export type BuddyBirdCategory = 'greeting' | 'food' | 'name' | 'etc';

export const categoryColor: Record<BuddyBirdCategory, string> = {
  greeting: BuddyBirdColors.primary,
  food: BuddyBirdColors.secondary,
  name: BuddyBirdColors.accentPurple,
  etc: BuddyBirdColors.streak,
};

export const categoryShadow: Record<BuddyBirdCategory, string> = {
  greeting: BuddyBirdColors.primaryShadow,
  food: BuddyBirdColors.secondaryShadow,
  name: BuddyBirdColors.accentPurpleShadow,
  etc: BuddyBirdColors.primaryShadow,
};

export const categoryTint: Record<BuddyBirdCategory, string> = {
  greeting: withAlphaOverCanvas(categoryColor.greeting, 0.08),
  food: withAlphaOverCanvas(categoryColor.food, 0.08),
  name: withAlphaOverCanvas(categoryColor.name, 0.08),
  etc: withAlphaOverCanvas(categoryColor.etc, 0.08),
};

export const categoryTintStrong: Record<BuddyBirdCategory, string> = {
  greeting: withAlphaOverCanvas(categoryColor.greeting, 0.12),
  food: withAlphaOverCanvas(categoryColor.food, 0.12),
  name: withAlphaOverCanvas(categoryColor.name, 0.12),
  etc: withAlphaOverCanvas(categoryColor.etc, 0.12),
};

export function withAlpha(hexToken: string, ratio: number): string {
  const hex = hexToken.replace('#', '');
  const alpha = Math.round(Math.max(0, Math.min(1, ratio)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `#${hex}${alpha}`;
}

export function withAlphaOverCanvas(hexToken: string, ratio: number): string {
  const alpha = Math.max(0, Math.min(1, ratio));
  const foreground = hexToRgb(hexToken);
  const canvas = hexToRgb(BuddyBirdColors.canvas);

  return rgbToHex({
    r: Math.round(foreground.r * alpha + canvas.r * (1 - alpha)),
    g: Math.round(foreground.g * alpha + canvas.g * (1 - alpha)),
    b: Math.round(foreground.b * alpha + canvas.b * (1 - alpha)),
  });
}

function hexToRgb(hexToken: string): { r: number; g: number; b: number } {
  const hex = hexToken.replace('#', '').slice(0, 6);

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${toHexPair(r)}${toHexPair(g)}${toHexPair(b)}`;
}

function toHexPair(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

export const Colors = {
  light: {
    text: BuddyBirdColors.ink,
    background: BuddyBirdColors.neutral,
    tint: BuddyBirdColors.primary,
    icon: BuddyBirdColors.ink,
    tabIconDefault: BuddyBirdColors.tabIconMuted,
    tabIconSelected: BuddyBirdColors.primary,
  },
  dark: {
    text: BuddyBirdColors.ink,
    background: BuddyBirdColors.neutral,
    tint: BuddyBirdColors.primary,
    icon: BuddyBirdColors.ink,
    tabIconDefault: BuddyBirdColors.tabIconMutedOnDark,
    tabIconSelected: BuddyBirdColors.primary,
  },
};

export const Fonts = {
  sans: 'Pretendard-Regular',
  serif: 'Pretendard-Regular',
  rounded: 'Nunito_800ExtraBold',
  mono: 'monospace',
  display: 'Nunito_900Black',
  displayBold: 'Nunito_700Bold',
  displayExtraBold: 'Nunito_800ExtraBold',
  body: 'Pretendard-Regular',
  bodyBold: 'Pretendard-Bold',
  bodyExtraBold: 'Pretendard-ExtraBold',
  bodyBlack: 'Pretendard-Black',
  splashWordmark: 'Fredoka_600SemiBold',
} as const;

export const Spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
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
  frequencyBar: 8,
  sm: 10,
  iconSquare: 12,
  field: 14,
  md: 14,
  lg: 16,
  listItem: 12,
  sectionCard: 18,
  card: 18,
  heroCard: 20,
  xl: 22,
  sheet: 24,
  celebration: 28,
  frame: 48,
  bottomTab: 20,
  avatarLg: 60,
  full: 999,
  pill: 9999,
};

export const Layout = {
  contentMaxWidth: 480,
};

export const Typography = {
  title: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  section: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  value: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  label: {
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.48,
  },
  onboardingTitle: {
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800' as const,
    letterSpacing: 0,
  },
  screenTitle: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  homeGreeting: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  cardTitle: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 22,
    fontWeight: '900' as const,
  },
  body: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700' as const,
  },
  bodySmall: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700' as const,
  },
  caption: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700' as const,
  },
  button: {
    fontFamily: Fonts.displayExtraBold,
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 0.32,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 18,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
};

export const Depth = {
  buttonSm: 4,
  buttonMd: 6,
  buttonLg: 7,
  buttonPressed: 1,
  card: 2,
  cardSelected: 3,
  tabActive: 3,
  buttonSmOffset: 4,
  buttonMdOffset: 6,
  buttonLgOffset: 7,
  buttonPressedOffset: 1,
  cardOffset: 2,
  selectedCardOffset: 3,
  elevatedOffset: 8,
};

export const Motion = {
  pressMs: 60,
  fastMs: 80,
  baseMs: 200,
  progressMs: 500,
};
