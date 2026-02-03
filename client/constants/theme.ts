import { Platform } from "react-native";

// ✨ VIBRANT COLOR PALETTE - More energetic and modern
export const AppColors = {
  // Primary colors - More vibrant blue
  primary: "#2563EB",           // Brighter blue (was #2D5F8D)
  primaryLight: "#60A5FA",
  primaryDark: "#1E40AF",
  
  // Accent colors - Bolder orange
  accent: "#F97316",            // More vibrant orange (was #E67E22)
  accentLight: "#FB923C",
  accentDark: "#EA580C",
  
  // Backgrounds
  background: "#FFFFFF",
  backgroundSecondary: "#F8FAFC",
  surface: "#FFFFFF",
  
  // Text
  textPrimary: "#0F172A",       // Darker, more contrast
  textSecondary: "#64748B",
  
  // Status colors - More vibrant
  statusNotStarted: "#F59E0B",   // Warm amber
  statusInProgress: "#3B82F6",   // Vibrant blue
  statusCompleted: "#10B981",    // Fresh green
  
  // Semantic colors - Punchy and clear
  success: "#10B981",            // Emerald green
  warning: "#F59E0B",            // Amber
  error: "#EF4444",              // Bright red
  info: "#3B82F6",               // Blue
  
  // Borders
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
};

const tintColorLight = AppColors.primary;
const tintColorDark = "#60A5FA";

export const Colors = {
  light: {
    text: AppColors.textPrimary,
    textSecondary: AppColors.textSecondary,
    buttonText: "#FFFFFF",
    tabIconDefault: AppColors.textSecondary,
    tabIconSelected: tintColorLight,
    link: AppColors.primary,
    backgroundRoot: AppColors.background,
    backgroundDefault: AppColors.surface,
    backgroundSecondary: AppColors.backgroundSecondary,
    backgroundTertiary: "#F1F5F9",
    border: AppColors.border,
    primary: AppColors.primary,
    accent: AppColors.accent,
  },
  dark: {
    text: "#F1F5F9",
    textSecondary: "#94A3B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#94A3B8",
    tabIconSelected: tintColorDark,
    link: tintColorDark,
    backgroundRoot: "#0F172A",
    backgroundDefault: "#1E293B",
    backgroundSecondary: "#334155",
    backgroundTertiary: "#475569",
    border: "#334155",
    primary: tintColorDark,
    accent: "#FB923C",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
  fabSize: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  round: 9999,
  full: 9999,
};

// Enhanced shadows for depth
export const Shadows = {
  small: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }),
};

export const Typography = {
  h1: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  smallMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});