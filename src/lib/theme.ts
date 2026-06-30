export type ThemeMode = 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_KEY = 'lemma_theme';

// Главная тема приложения — СВЕТЛАЯ. Тёмная включается только вручную в
// Настройках. Режима «авто/system» больше нет; legacy-значение 'system'
// (от прежнего дефолта) трактуем как светлую.
export function getThemeMode(): ThemeMode {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

export function setThemeMode(mode: ThemeMode): void {
  localStorage.setItem(THEME_KEY, mode);
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode;
}

export const THEME_ORDER: ThemeMode[] = ['light', 'dark'];
export const THEME_LABELS: Record<ThemeMode, string> = {
  light: '☀ СВЕТЛАЯ',
  dark: '☾ ТЁМНАЯ',
};
