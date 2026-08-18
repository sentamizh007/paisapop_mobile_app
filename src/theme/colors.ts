import { useStore } from '../store/useStore';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceMid: string;
  primary: string;
  primaryDark: string;
  income: string;
  expense: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  danger: string;
  dangerBg: string;
  warning: string;
  info: string;
  border: string;
  overlay: string;
  // legacy aliases
  surfaceLight: string;
  success: string;
  successBg: string;
  glass: string;
  cardBg: string;
}

export const darkColors: ThemeColors = {
  background: '#09090B',
  surface: '#131315',
  surfaceElevated: '#18181B',
  surfaceMid: '#27272A',

  primary: '#FFFFFF',
  primaryDark: '#E4E4E7',

  income: '#22C55E',
  expense: '#EF4444',

  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  info: '#3B82F6',

  border: '#27272A',
  overlay: 'rgba(0, 0, 0, 0.75)',

  surfaceLight: '#27272A',
  success: '#22C55E',
  successBg: 'rgba(34, 197, 94, 0.12)',
  glass: 'rgba(19, 19, 21, 0.92)',
  cardBg: '#131315',
};

export const lightColors: ThemeColors = {
  background: '#F4F4F5',
  surface: '#FFFFFF',
  surfaceElevated: '#F9FAFB',
  surfaceMid: '#E4E4E7',

  primary: '#09090B',
  primaryDark: '#27272A',

  income: '#16A34A',
  expense: '#DC2626',

  textPrimary: '#09090B',
  textSecondary: '#71717A',
  textMuted: '#A1A1AA',

  danger: '#DC2626',
  dangerBg: 'rgba(220, 38, 38, 0.08)',
  warning: '#D97706',
  info: '#2563EB',

  border: '#E4E4E7',
  overlay: 'rgba(0, 0, 0, 0.5)',

  surfaceLight: '#F4F4F5',
  success: '#16A34A',
  successBg: 'rgba(22, 163, 74, 0.08)',
  glass: 'rgba(255, 255, 255, 0.92)',
  cardBg: '#FFFFFF',
};

export const colors = darkColors;

export const useThemeColors = (): ThemeColors => {
  const theme = useStore((s) => s.theme);
  return theme === 'light' ? lightColors : darkColors;
};

