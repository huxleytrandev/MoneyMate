import { DefaultTheme as MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';
export const paperTheme = {
  ...MD3LightTheme,
  roundness: 5,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.green,
    primaryContainer: colors.lime,
    secondaryContainer: colors.lime,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.background,
    onSurface: colors.ink,
    onSurfaceVariant: colors.muted,
    outline: colors.border,
    error: colors.expense,
    errorContainer: colors.softRed,
    elevation: { ...MD3LightTheme.colors.elevation, level3: colors.surface },
  },
};
