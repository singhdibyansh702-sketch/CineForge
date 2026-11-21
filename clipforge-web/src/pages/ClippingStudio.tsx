import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Scissors,
  Crop,
  Type,
  Copy,
  Trash2,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { api, resolveMediaUrl } from '../api/client';
import { Project, Clip, CropSetting, CaptionPreset } from '../types';
import { CropEditor } from '../components/CropEditor';
import { CaptionEditor } from '../components/CaptionEditor';
import { ExportModal } from '../components/ExportModal';

interface ClippingStudioProps {
  projectId: string | null;
  onNavigateProjects: () => void;
}

export const ClippingStudio: React.FC<ClippingStudioProps> = ({
  projectId,
  onNavigateProjects
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [presets, setPresets] = useState<CaptionPreset[]>([]);
  const [activeTab, setActiveTab] = useState<'timestamps' | 'crop' | 'captions'>('timestamps');
  
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // New clip form state
  const [newClipName, setNewClipName] = useState('');
  const [newClipStart, setNewClipStart] = useState('00:00:00');
  const [newClipDuration, setNewClipDuration] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTargetClip, setExportTargetClip] = useState<Clip | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData(projectId);
    }
  }, [projectId]);

  const loadProjectData = async (id: string) => {
    try {
      setLoading(true);
      const [projData, clipsData, presetsData] = await Promise.all([
        api.getProject(id),
        api.getClips(id),
        api.getPresets(),
      ]);
      setProject(projData);
      setClips(clipsData);
      setPresets(presetsData);
      if (clipsData.length > 0) {
        setSelectedClipId(clipsData[0].id);
      }
    } catch (err) {
      console.error('Failed to load project in studio:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convert seconds to HH:MM:SS
  const secondsToHms = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Convert HH:MM:SS string to seconds
  const hmsToSeconds = (hms: string): number => {
    const parts = hms.split(':').map((p) => parseFloat(p) || 0);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
  };

  const selectedClip = clips.find((c) => c.id === selectedClipId) || clips[0];

  // Video playback timeupdate
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Auto pause at clip end if previewing single clip
      if (selectedClip && videoRef.current.currentTime >= selectedClip.end_time) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Play clip preview
  const handlePreviewClip = (clip: Clip) => {
    setSelectedClipId(clip.id);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.start_time;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Add Clip handler
  const handleAddClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setFormError(null);
    const startSec = hmsToSeconds(newClipStart);
    const durSec = parseFloat(newClipDuration);

    const videoDur = project.source_video?.duration || 3600;

    if (startSec >= videoDur) {
      setFormError(`Start time exceeds video duration (${secondsToHms(videoDur)})`);
      return;
    }
    if (durSec <= 0) {
      setFormError('Duration must be greater than 0 seconds');
      return;
    }

    try {
      const clipNumber = clips.length + 1;
      const defaultName = newClipName.trim() || `Clip ${clipNumber.toString().padStart(2, '0')}`;

      await api.createClip({
        project_id: project.id,
        name: defaultName,
        start_time: startSec,
        duration: durSec,
        language: 'en',
      });

      // Reload clips
      const updatedClips = await api.getClips(project.id);
      setClips(updatedClips);
      setSelectedClipId(updatedClips[updatedClips.length - 1].id);

      // Reset form with offset for next clip
      setNewClipName('');
      setNewClipStart(secondsToHms(Math.min(videoDur - 10, startSec + durSec + 2)));
    } catch (err: any) {
      setFormError(err.message || 'Failed to create clip');
    }
  };

  // Duplicate clip
  const handleDuplicateClip = async (clipId: string) => {
    try {
      await api.duplicateClip(clipId);
      if (project) {
        const updated = await api.getClips(project.id);
        setClips(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate clip');
    }
  };

  // Delete clip
  const handleDeleteClip = async (clipId: string) => {
    if (!confirm('Are you sure you want to delete this clip?')) return;
    try {
      await api.deleteClip(clipId);
      const updated = clips.filter((c) => c.id !== clipId);
      setClips(updated);
      if (selectedClipId === clipId && updated.length > 0) {
        setSelectedClipId(updated[0].id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete clip');
    }
  };

  // Update Crop Setting for selected clip
  const handleUpdateCrop = async (updatedCrop: CropSetting) => {
    if (!selectedClip) return;
    try {
      await api.updateClip(selectedClip.id, {
        crop_setting: updatedCrop,
      });
      // Update local state
      setClips((prev) =>
        prev.map((c) =>
          c.id === selectedClip.id ? { ...c, crop_setting: updatedCrop } : c
        )
      );
    } catch (err) {
      console.error('Failed to update crop:', err);
    }
  };

  // Update Caption Preset
  const handleUpdatePreset = async (presetId: string) => {
    if (!selectedClip) return;
    try {
      await api.updateClip(selectedClip.id, {
        caption_preset_id: presetId,
      });
      if (project) {
        const refreshed = await api.getClips(project.id);
        setClips(refreshed);
      }
    } catch (err) {
      console.error('Failed to update preset:', err);
    }
  };

  if (!projectId || !project) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <Scissors className="w-10 h-10 text-brand-400 mx-auto" />
        <h3 className="text-base font-bold text-white dark:text-white light:text-zinc-900">
          No project loaded in studio
        </h3>
        <p className="text-xs text-zinc-400">
          Select an existing project or create a new one to begin editing clips.
        </p>
        <button
          onClick={onNavigateProjects}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold"
        >
          Browse Projects
        </button>
      </div>
    );
  }

  const sourceVid = project.source_video;
  const videoDur = sourceVid?.duration || 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Studio Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-white dark:text-white light:text-zinc-900 tracking-tight">
              {project.title}
            </h2>
            <span className="px-2 py-0.5 rounded bg-brand-600/20 text-brand-300 font-bold text-[10px] uppercase">
              {project.target_aspect_ratio}
            </span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
            Source Duration: <span className="font-mono text-zinc-300 dark:text-zinc-300 light:text-zinc-700">{secondsToHms(videoDur)}</span> • {clips.length} Clips Defined
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setExportTargetClip(null);
              setIsExportModalOpen(true);
            }}
            disabled={clips.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate All Clips</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Player & Active Tool (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Video Monitor */}
          <div className="rounded-xl bg-black border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 overflow-hidden relative shadow-md">
            {sourceVid?.stream_url ? (
              <video
                ref={videoRef}
                src={resolveMediaUrl(sourceVid.stream_url)}
                onTimeUpdate={handleTimeUpdate}
                className="w-full aspect-video object-contain"
                playsInline
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center text-zinc-500 text-xs">
                No video stream available
              </div>
            )}

            {/* Custom Transport Controls Overlay */}
            <div className="p-3 bg-[#0A0A0A]/90 backdrop-blur border-t border-[#2A2A2A] flex items-center justify-between text-xs text-zinc-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      } else {
                        videoRef.current.play();
                        setIsPlaying(true);
                      }
                    }
                  }}
                  className="p-1.5 rounded-lg bg-[#1C1C1C] hover:bg-brand-600 text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <span className="font-mono text-xs">
                  {secondsToHms(currentTime)} / {secondsToHms(videoDur)}
                </span>
              </div>

              {selectedClip && (
                <div className="text-[11px] text-zinc-400">
                  Active Clip: <span className="text-brand-300 font-semibold">{selectedClip.name}</span> ({selectedClip.start_formatted} - {selectedClip.end_formatted})
                </div>
              )}
            </div>
          </div>

          {/* Studio Tool Mode Switcher (Crop Editor / Captions Styler) */}
          <div className="p-1 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 flex gap-1">
            <button
              onClick={() => setActiveTab('timestamps')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'timestamps'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Timestamps & Clips ({clips.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('crop')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'crop'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Crop className="w-3.5 h-3.5" />
              <span>Visual Crop & Layout</span>
            </button>

            <button
              onClick={() => setActiveTab('captions')}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === 'captions'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Subtitles & Captions</span>
            </button>
          </div>

          {/* Active Tool View */}
          {activeTab === 'crop' && (
            <CropEditor
              sourceVideo={sourceVid}
              cropSetting={selectedClip?.crop_setting}
              onUpdate={handleUpdateCrop}
              videoCurrentTime={currentTime}
            />
          )}

          {activeTab === 'captions' && selectedClip && (
            <CaptionEditor
              clip={selectedClip}
              presets={presets}
              onUpdatePreset={handleUpdatePreset}
              onRefreshClip={() => loadProjectData(project.id)}
            />
          )}

          {activeTab === 'timestamps' && (
            <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-3">
              <span className="text-xs font-semibold text-white dark:text-white light:text-zinc-900 uppercase tracking-wider block">
                Add Multi-Timestamp Clip Segment
              </span>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddClip} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">Clip Name</label>
                  <input
                    type="text"
                    placeholder={`e.g. Clip ${(clips.length + 1).toString().padStart(2, '0')}`}
                    value={newClipName}
                    onChange={(e) => setNewClipName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Start (HH:MM:SS)</label>
                  <input
                    type="text"
                    value={newClipStart}
                    onChange={(e) => setNewClipStart(e.target.value)}
                    placeholder="00:02:15"
                    className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Duration (Sec)</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={newClipDuration}
                      onChange={(e) => setNewClipDuration(e.target.value)}
                      min="1"
                      className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white font-mono focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold flex items-center justify-center shrink-0"
                      title="Add Clip"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Clip Timeline & Timestamp Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-white dark:text-white light:text-zinc-900 uppercase tracking-wider">
              Project Clips ({clips.length})
            </span>
            <span className="text-[11px] text-zinc-400">
              Select clip to edit crop & captions
            </span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {clips.map((clip, idx) => {
              const isSelected = clip.id === selectedClipId;
              return (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 border-brand-500 shadow-sm'
                      : 'bg-[#141414] dark:bg-[#141414] light:bg-white border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-white dark:text-white light:text-zinc-900">
                        {clip.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewClip(clip);
                        }}
                        className="p-1.5 rounded-md hover:bg-brand-600 text-zinc-400 hover:text-white transition-colors"
                        title="Preview clip timestamps"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateClip(clip.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-[#2A2A2A] text-zinc-400 hover:text-white transition-colors"
                        title="Duplicate clip"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClip(clip.id);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete clip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Timestamp specs */}
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 font-mono text-[11px] mb-2.5 text-center">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block">Start</span>
                      <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-800 font-semibold">{clip.start_formatted}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block">Duration</span>
                      <span className="text-brand-400 font-semibold">{clip.duration}s</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase block">End</span>
                      <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-800 font-semibold">{clip.end_formatted}</span>
                    </div>
                  </div>

                  {/* Footer Meta & Single Export Button */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      {clip.crop_setting?.preset_mode || 'Center'} Crop • {clip.language?.toUpperCase() || 'EN'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExportTargetClip(clip);
                        setIsExportModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export Clip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        selectedClip={exportTargetClip}
      />
    </div>
  );
};
