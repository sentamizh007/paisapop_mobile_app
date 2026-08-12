import { useStore } from '../store/useStore';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceLight: string;
  primary: string;
  primaryDark: string;
  textPrimary: string;
  textSecondary: string;
  danger: string;
  dangerBg: string;
  success: string;
  successBg: string;
  warning: string;
  info: string;
  border: string;
  overlay: string;
  glass: string;
}

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLight: '#F1F5F9',
  primary: '#6366F1', // Indigo
  primaryDark: '#4F46E5',
  textPrimary: '#0F172A', // Slate 900
  textSecondary: '#64748B', // Slate 500
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  info: '#3B82F6',
  border: '#E2E8F0',
  overlay: 'rgba(0, 0, 0, 0.4)',
  glass: 'rgba(255, 255, 255, 0.7)',
};

export const darkColors: ThemeColors = {
  background: '#0F172A', // Very dark slate
  surface: '#1E293B',
  surfaceLight: '#334155',
  primary: '#818CF8', // Lighter Indigo
  primaryDark: '#6366F1',
  textPrimary: '#F8FAFC', // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  danger: '#F87171',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  success: '#34D399',
  successBg: 'rgba(16, 185, 129, 0.1)',
  warning: '#FBBF24',
  info: '#60A5FA',
  border: '#334155',
  overlay: 'rgba(0, 0, 0, 0.6)',
  glass: 'rgba(30, 41, 59, 0.7)',
};

// Fallback for files that haven't been updated yet (will be removed eventually)
export const colors = lightColors;

export const useThemeColors = () => {
  const theme = useStore((state) => state.theme);
  return theme === 'dark' ? darkColors : lightColors;
};

