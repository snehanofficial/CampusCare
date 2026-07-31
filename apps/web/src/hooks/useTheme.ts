import { useTheme as useThemeFromProvider, type ThemeContextValue } from "../app/providers/ThemeProvider.js";

export function useTheme(): ThemeContextValue {
  return useThemeFromProvider();
}
export type { Theme } from "../app/providers/ThemeProvider.js";
export type { ThemeContextValue };
