import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/theme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`cursor-pointer group relative flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs font-semibold transition-all duration-200 ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200 hover:border-amber-500/40'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-blue-600'
      } ${className}`}
      title={isDark ? 'Passa al tema Chiaro' : 'Passa al tema Scuro'}
      aria-label={isDark ? 'Passa al tema Chiaro' : 'Passa al tema Scuro'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
      )}

      {showLabel && (
        <span className="hidden sm:inline text-xs font-medium">
          {isDark ? 'Chiaro' : 'Scuro'}
        </span>
      )}
      
      {!showLabel && (
        <span className="hidden lg:inline text-2xs font-medium text-slate-500 dark:text-slate-400">
          {isDark ? 'Chiaro' : 'Scuro'}
        </span>
      )}
    </button>
  );
};
