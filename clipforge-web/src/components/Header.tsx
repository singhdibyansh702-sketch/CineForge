import React from 'react';
import { Sun, Moon, Plus, Video, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { NavSection } from './Sidebar';

interface HeaderProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  projectName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onNavigate,
  projectName
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const titles: Record<NavSection, string> = {
    dashboard: 'Dashboard',
    'new-project': 'New Project',
    'my-projects': 'My Projects',
    studio: 'Clipping Studio',
    presets: 'Caption Presets',
    exports: 'Export History',
    settings: 'Settings',
  };

  return (
    <header className="h-16 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] bg-[#0A0A0A]/95 dark:bg-[#0A0A0A]/95 light:bg-white/95 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-6 transition-colors">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white dark:text-white light:text-zinc-900 tracking-tight">
          {titles[activeSection]}
        </h1>
        {projectName && activeSection === 'studio' && (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
            <Video className="w-3.5 h-3.5 text-brand-400 light:text-brand-600" />
            <span className="font-medium max-w-[200px] truncate">{projectName}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {activeSection !== 'new-project' && (
          <button
            onClick={() => onNavigate('new-project')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg bg-[#141414] dark:bg-[#141414] light:bg-zinc-100 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-zinc-900 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 stroke-[2]" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-600 stroke-[2]" />
          )}
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/40 text-brand-400 flex items-center justify-center font-bold text-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'E'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-white dark:text-white light:text-zinc-900 leading-tight">
              {user?.full_name || 'Editor'}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
              Pro Clipper
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
