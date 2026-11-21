import React from 'react';
import {
  Sun,
  Moon,
  Shield,
  Cpu,
  User as UserIcon,
  HardDrive,
  CheckCircle2,
  Sliders,
  Palette
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] pb-5">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white dark:text-white light:text-zinc-900">
          Studio Settings & Preferences
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
          Customize your theme appearance, examine FFmpeg engine capabilities, and manage your account.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="p-6 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-5">
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white dark:text-white light:text-zinc-900">
            Interface Theme System
          </h3>
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 leading-relaxed">
          Switch between Pure Black (#000000) Dark Mode and Warm White Light Mode. Preferences are saved and persist automatically across browser sessions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Dark Mode Card */}
          <div
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              theme === 'dark'
                ? 'border-brand-500 bg-[#000000] text-white shadow-lg'
                : 'border-[#2A2A2A] bg-[#0A0A0A] text-zinc-400 hover:border-zinc-500'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-brand-400" />
                <span className="font-bold text-sm text-white">Pure Black Dark Mode</span>
              </div>
              {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
            </div>

            <div className="p-3 rounded-lg bg-[#141414] border border-[#2A2A2A] text-[11px] text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Background:</span>
                <span className="font-mono text-zinc-200">#000000 (Pure Black)</span>
              </div>
              <div className="flex justify-between">
                <span>Card Surface:</span>
                <span className="font-mono text-zinc-200">#141414</span>
              </div>
              <div className="flex justify-between">
                <span>Accent:</span>
                <span className="font-mono text-brand-400">#8B5CF6 (Restrained Violet)</span>
              </div>
            </div>
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              theme === 'light'
                ? 'border-brand-600 bg-white text-zinc-900 shadow-lg'
                : 'border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 bg-zinc-50 text-zinc-600 hover:border-zinc-400'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-sm text-zinc-900">Clean Light Mode</span>
              </div>
              {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
            </div>

            <div className="p-3 rounded-lg bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>Background:</span>
                <span className="font-mono text-zinc-800">#F9FAFB (Off-White)</span>
              </div>
              <div className="flex justify-between">
                <span>Card Surface:</span>
                <span className="font-mono text-zinc-800">#FFFFFF (White)</span>
              </div>
              <div className="flex justify-between">
                <span>Accent:</span>
                <span className="font-mono text-brand-600">#7C3AED (Violet)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FFmpeg Video Processing Engine Specs */}
      <div className="p-6 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-4">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white dark:text-white light:text-zinc-900">
            FFmpeg Processing Engine Status
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-1.5">
            <span className="text-zinc-400 font-medium">Video Codecs & Filters</span>
            <p className="font-mono text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-semibold">
              libx264 • H.264 High Profile • scale • crop • ass • subtitles
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-1.5">
            <span className="text-zinc-400 font-medium">Audio Architecture</span>
            <p className="font-mono text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-semibold">
              Native AAC 192k Stereo • 48 kHz Preservation
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-1.5">
            <span className="text-zinc-400 font-medium">Output Aspect Ratios</span>
            <p className="font-mono text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-semibold">
              9:16 Vertical • 1:1 Square • 16:9 Landscape • Custom
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-1.5">
            <span className="text-zinc-400 font-medium">Supported Speech Models</span>
            <p className="font-mono text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-semibold">
              English • Hindi (हिन्दी) • Hinglish
            </p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="p-6 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-3">
        <div className="flex items-center gap-2.5">
          <UserIcon className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white dark:text-white light:text-zinc-900">
            Account Information
          </h3>
        </div>

        <div className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 space-y-1">
          <p>
            Logged in as: <strong className="text-white dark:text-white light:text-zinc-900">{user?.full_name || 'Senior Video Editor'}</strong> ({user?.email || 'editor@clipforge.io'})
          </p>
          <p>Role: Professional Video Editor & Clipping Specialist</p>
        </div>
      </div>
    </div>
  );
};
