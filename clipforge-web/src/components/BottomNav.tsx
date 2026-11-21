import React from 'react';
import {
  LayoutDashboard,
  Film,
  Folders,
  Type,
  History,
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface BottomNavProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeSection, onNavigate }) => {
  const items = [
    { id: 'dashboard' as NavSection, label: 'Home', icon: LayoutDashboard },
    { id: 'studio' as NavSection, label: 'Studio', icon: Film },
    { id: 'my-projects' as NavSection, label: 'Projects', icon: Folders },
    { id: 'presets' as NavSection, label: 'Captions', icon: Type },
    { id: 'exports' as NavSection, label: 'Exports', icon: History },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 dark:bg-[#0A0A0A]/95 light:bg-white/95 backdrop-blur border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 px-2 py-1.5 flex items-center justify-around select-none">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
              isActive
                ? 'text-brand-400 dark:text-brand-400 light:text-brand-700 font-semibold'
                : 'text-zinc-400 dark:text-zinc-400 light:text-zinc-500 hover:text-white dark:hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
