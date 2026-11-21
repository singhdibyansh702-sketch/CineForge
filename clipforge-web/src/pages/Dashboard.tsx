import React, { useEffect, useState } from 'react';
import {
  FolderPlus,
  Film,
  Scissors,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Play
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { NavSection } from '../components/Sidebar';

interface DashboardProps {
  onNavigate: (section: NavSection) => void;
  onSelectProject: (projectId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectProject }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white dark:text-white light:text-zinc-900">
            Welcome to ClipForge Studio
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
            Turn long-form videos into viral vertical short clips with multi-timestamp clipping, precise framing, and multilingual captions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new-project')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Projects</span>
            <Film className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white dark:text-white light:text-zinc-900">
            {stats?.total_projects ?? 0}
          </p>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1 block">Active video workspaces</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Clips Created</span>
            <Scissors className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white dark:text-white light:text-zinc-900">
            {stats?.total_clips ?? 0}
          </p>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1 block">From timestamp segments</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">In Processing</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white dark:text-white light:text-zinc-900">
            {stats?.processing_clips ?? 0}
          </p>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1 block">FFmpeg render queue</span>
        </div>

        <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <div className="flex items-center justify-between text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Exports Ready</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white dark:text-white light:text-zinc-900">
            {stats?.completed_exports ?? 0}
          </p>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1 block">Completed MP4 & ZIP files</span>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white dark:text-white light:text-zinc-900 tracking-tight">
            Recent Projects
          </h3>
          <button
            onClick={() => onNavigate('my-projects')}
            className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 light:text-brand-600 transition-colors"
          >
            <span>View all projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
            Loading projects...
          </div>
        ) : stats?.recent_projects && stats.recent_projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recent_projects.map((project) => (
              <div
                key={project.id}
                className="group p-5 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 hover:border-brand-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-white dark:text-white light:text-zinc-900 group-hover:text-brand-400 transition-colors line-clamp-1">
                      {project.title}
                    </h4>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
                      {project.target_aspect_ratio}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 py-3 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-100 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                      {project.clips_count} clips
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {project.video_duration > 0 ? formatSeconds(project.video_duration) : 'No video'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onSelectProject(project.id);
                      onNavigate('studio');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 group-hover:bg-brand-600 text-xs font-semibold text-zinc-200 dark:text-zinc-200 light:text-zinc-700 group-hover:text-white transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Open in Studio</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
            <Film className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-white dark:text-white light:text-zinc-900 mb-1">No projects yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-4">
              Get started by creating your first video clipping project.
            </p>
            <button
              onClick={() => onNavigate('new-project')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
