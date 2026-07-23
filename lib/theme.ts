export type ThemePreference = "system" | "light" | "dark";

export function nextTheme(theme: ThemePreference): ThemePreference {
  const cycle: Record<ThemePreference, ThemePreference> = { system: "light", light: "dark", dark: "system" };
  return cycle[theme];
}
