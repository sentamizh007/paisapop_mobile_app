
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
  // keep legacy aliases so existing code doesn't break
  surfaceLight: string;
  success: string;
  successBg: string;
  glass: string;
}

/**
 * PaisaPop Dark — the only theme.
 *
 * Palette rationale:
 *  - Background: #0C0C0E  — slightly warmer than pure black, easier on OLED
 *  - Surface:    #161618  — card layer
 *  - Primary:    #C084FC  — purple-400, high contrast on dark, premium fintech feel
 *  - Expense:    #FB923C  — orange-400, warm/actionable (not alarming red)
 *  - Income:     #4ADE80  — green-400, bright and readable
 *  - Danger:     #EF4444  — reserved ONLY for destructive actions
 */
export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0C0C0E',
  surface: '#161618',
  surfaceElevated: '#1E1E22',
  surfaceMid: '#252529',

  // Brand
  primary: '#FFFFFF',   // white
  primaryDark: '#E4E4E7',   // zinc-200

  // Semantic transaction colors
  income: '#4ADE80',   // green-400
  expense: '#FB923C',   // orange-400

  // Typography
  textPrimary: '#F4F4F5',   // zinc-100
  textSecondary: '#71717A',   // zinc-500
  textMuted: '#3F3F46',   // zinc-700

  // States
  danger: '#EF4444',
  dangerBg: 'rgba(239,68,68,0.12)',
  warning: '#F59E0B',
  info: '#60A5FA',

  // Structure
  border: '#2A2A2E',
  overlay: 'rgba(0,0,0,0.72)',

  // Legacy aliases (keeps old code working without mass find/replace)
  surfaceLight: '#252529',   // = surfaceMid
  success: '#4ADE80',   // = income
  successBg: 'rgba(74,222,128,0.12)',
  glass: 'rgba(22,22,24,0.9)',
};

export const colors = darkColors;

export const useThemeColors = (): ThemeColors => darkColors;
