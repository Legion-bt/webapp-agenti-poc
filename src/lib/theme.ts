import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'agentego_theme';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === 'light' || val === 'dark' || val === 'system') {
    return val;
  }
  return 'system';
}

export function isDarkActive(): boolean {
  if (typeof window === 'undefined') return false;
  const theme = getStoredTheme();
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (err) {
    console.error('Failed to save theme in localStorage', err);
  }
  applyTheme(theme);
  notify();
}

export function toggleTheme() {
  const currentDark = isDarkActive();
  setTheme(currentDark ? 'light' : 'dark');
}

// Initialize on file load
if (typeof window !== 'undefined') {
  try {
    applyTheme(getStoredTheme());

    // Listen to system changes if theme is system
    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = () => {
        if (getStoredTheme() === 'system') {
          applyTheme('system');
          notify();
        }
      };
      if (media?.addEventListener) {
        media.addEventListener('change', handleMediaChange);
      } else if (media?.addListener) {
        media.addListener(handleMediaChange);
      }
    }
  } catch (err) {
    console.warn('Error initializing theme listener:', err);
  }
}

/**
 * React hook to access and toggle theme (Chiaro / Scuro)
 */
export function useTheme() {
  const [theme, setLocalTheme] = useState<Theme>(getStoredTheme);
  const [isDark, setIsDark] = useState<boolean>(isDarkActive);

  useEffect(() => {
    const handler = () => {
      setLocalTheme(getStoredTheme());
      setIsDark(isDarkActive());
    };
    listeners.add(handler);
    handler();
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
}
