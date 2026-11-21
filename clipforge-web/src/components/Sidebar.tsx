import React from 'react';
import {
  LayoutDashboard,
  FolderPlus,
  Folders,
  Film,
  Type,
  History,
  Settings,
  Scissors
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'new-project'
  | 'my-projects'
  | 'studio'
  | 'presets'
  | 'exports'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  selectedProjectId?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  selectedProjectId
}) => {
  const navItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-project' as NavSection, label: 'New Project', icon: FolderPlus },
    { id: 'my-projects' as NavSection, label: 'My Projects', icon: Folders },
    { id: 'studio' as NavSection, label: 'Clipping Studio', icon: Film, badge: selectedProjectId ? 'Active' : undefined },
    { id: 'presets' as NavSection, label: 'Caption Presets', icon: Type },
    { id: 'exports' as NavSection, label: 'Export History', icon: History },
    { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-white h-screen sticky top-0 z-30 transition-colors select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
          <Scissors className="w-5 h-5 text-white stroke-[2.2]" />
        </div>
        <div>
          <span className="font-semibold text-base tracking-tight text-white dark:text-white light:text-zinc-900 block leading-tight">
            ClipForge
          </span>
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 tracking-wider uppercase block">
            Studio Pro
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/15 text-brand-400 dark:text-brand-400 light:bg-brand-50 light:text-brand-700 font-semibold'
                  : 'text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white dark:hover:text-white light:hover:text-zinc-900 hover:bg-[#141414] dark:hover:bg-[#141414] light:hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 stroke-[1.8] ${
                    isActive
                      ? 'text-brand-400 light:text-brand-700'
                      : 'text-zinc-400 dark:text-zinc-400 light:text-zinc-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-600/20 text-brand-300 light:bg-brand-100 light:text-brand-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status Panel */}
      <div className="p-4 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
        <div className="p-3 rounded-lg bg-[#141414] dark:bg-[#141414] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-500 font-medium">Engine Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FFmpeg 7.x Ready
            </span>
          </div>
          <p className="text-zinc-400 dark:text-zinc-400 light:text-zinc-500 text-[11px] leading-relaxed">
            H.264 High Profile • Multilingual Whisper Subtitles
          </p>
        </div>
      </div>
    </aside>
  );
};
