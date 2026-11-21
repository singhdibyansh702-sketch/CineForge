import React, { useEffect, useState } from 'react';
import {
  FolderPlus,
  Film,
  Trash2,
  Play,
  Clock,
  Scissors,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { api } from '../api/client';
import { Project } from '../types';
import { NavSection } from '../components/Sidebar';

interface MyProjectsProps {
  onNavigate: (section: NavSection) => void;
  onSelectProject: (projectId: string) => void;
}

export const MyProjects: React.FC<MyProjectsProps> = ({ onNavigate, onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project? All associated clips will be removed.')) {
      return;
    }
    try {
      setDeletingId(id);
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white dark:text-white light:text-zinc-900">
            My Projects
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
            Manage your video workspaces and continue editing timestamps and caption styles.
          </p>
        </div>
        <button
          onClick={() => onNavigate('new-project')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          Loading your projects...
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectProject(p.id);
                onNavigate('studio');
              }}
              className="group p-5 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 hover:border-brand-500/50 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-white dark:text-white light:text-zinc-900 group-hover:text-brand-400 transition-colors line-clamp-1">
                    {p.title}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 shrink-0">
                    {p.target_aspect_ratio}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                  {p.description || 'No description provided.'}
                </p>

                {/* Source video pill */}
                {p.source_video && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-4">
                    <Film className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="truncate flex-1 font-mono text-[11px]">{p.source_video.filename}</span>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {formatSeconds(p.source_video.duration)}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 py-3 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-100 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                    {p.clips_count ?? 0} clips
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(p.id);
                      onNavigate('studio');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 group-hover:bg-brand-600 text-xs font-semibold text-zinc-200 dark:text-zinc-200 light:text-zinc-700 group-hover:text-white transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Open Studio</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    disabled={deletingId === p.id}
                    title="Delete project"
                    className="p-2 rounded-lg bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <Film className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white dark:text-white light:text-zinc-900 mb-1">
            No projects found
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 max-w-sm mx-auto mb-5 leading-relaxed">
            Create a new project to start clipping long-form videos with multiple timestamps and custom captions.
          </p>
          <button
            onClick={() => onNavigate('new-project')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>
      )}
    </div>
  );
};
