export const colors = {
  primary: '#0FA968',
  primaryDark: '#087A4C',
  primaryLight: '#DFF4EB',

  ink: '#0B2E22',
  inkSoft: '#164536',
  inkDeep: '#071C15',

  teal: '#0C9E96',
  tealLight: '#DFF5F4',

  pink: '#E24A82',
  pinkDark: '#B23364',
  pinkLight: '#FCE3ED',

  amber: '#F0A828',
  amberLight: '#FDECC8',

  danger: '#E63946',
  dangerLight: '#FBDCDF',

  background: '#F5F7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1EE',

  textPrimary: '#12261E',
  textSecondary: '#5C6862',
  textMuted: '#93A19A',
  textInverse: '#FFFFFF',

  border: '#E3E8E3',
  borderStrong: '#CDD6CC',

  overlay: 'rgba(7, 28, 21, 0.6)',
  transparent: 'transparent',

  // Tema escuro (AngoTour Driver) - baseado no mockup do app do motorista
  nightBg: '#0B1220',
  nightSurface: '#141C2E',
  nightSurfaceAlt: '#1B2740',
  nightBorder: '#26314A',
  nightTextPrimary: '#F3F6FA',
  nightTextSecondary: '#8C97AE',
} as const;

export const fontFamily = {
  displayRegular: 'Sora_400Regular',
  displayMedium: 'Sora_500Medium',
  displaySemiBold: 'Sora_600SemiBold',
  displayBold: 'Sora_700Bold',
  textRegular: 'Inter_400Regular',
  textMedium: 'Inter_500Medium',
  textSemiBold: 'Inter_600SemiBold',
  textBold: 'Inter_700Bold',
} as const;

export const typography = {
  h1: { fontFamily: fontFamily.displayBold, fontSize: 30, lineHeight: 36 },
  h2: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, lineHeight: 30 },
  h3: { fontFamily: fontFamily.displaySemiBold, fontSize: 19, lineHeight: 25 },
  subtitle: { fontFamily: fontFamily.textSemiBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.textRegular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.textMedium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamily.textRegular, fontSize: 13, lineHeight: 18 },
  captionMedium: { fontFamily: fontFamily.textMedium, fontSize: 13, lineHeight: 18 },
  tiny: { fontFamily: fontFamily.textMedium, fontSize: 11, lineHeight: 14 },
} as const;

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 10, md: 16, lg: 20, xl: 28, pill: 999 } as const;

export const shadow = {
  soft: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

const theme = { colors, fontFamily, typography, spacing, radius, shadow };
export default theme;
