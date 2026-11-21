import React, { useState } from 'react';
import {
  UploadCloud,
  Video,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileVideo,
  Info,
  Clock,
  Plus,
  Trash2,
  Copy,
  Layers,
  Scissors
} from 'lucide-react';
import { api } from '../api/client';
import { NavSection } from '../components/Sidebar';

interface NewProjectProps {
  onNavigate: (section: NavSection) => void;
  onProjectCreated: (projectId: string) => void;
}

interface TimelineSegment {
  id: string;
  name: string;
  startHms: string; // HH:MM:SS
  duration: number; // in seconds
  endHms: string;   // HH:MM:SS
}

// Convert seconds to HH:MM:SS
const secToHms = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Convert HH:MM:SS string to seconds
const hmsToSec = (hms: string): number => {
  const parts = hms.trim().split(':').map((p) => parseFloat(p) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
};

// Validate HH:MM:SS format
const isValidHms = (hms: string): boolean => {
  const trimmed = hms.trim();
  // Accepts HH:MM:SS or H:MM:SS or MM:SS
  return /^(?:(?:[0-9]{1,2}:)?[0-5]?[0-9]:[0-5][0-9])$/.test(trimmed);
};

export const NewProject: React.FC<NewProjectProps> = ({ onNavigate, onProjectCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAspect, setTargetAspect] = useState<'9:16' | '16:9' | '1:1' | 'custom'>('9:16');
  
  const [sourceType, setSourceType] = useState<'upload' | 'youtube' | 'sample'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Mandatory Timeline Segments state with multiple timelines
  const [timelines, setTimelines] = useState<TimelineSegment[]>([
    {
      id: 'timeline-1',
      name: 'Clip 01: Hook',
      startHms: '00:00:00',
      duration: 30,
      endHms: '00:00:30',
    },
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['mp4', 'mov', 'mkv', 'webm'].includes(ext || '')) {
        setErrorMessage('Please choose a valid video file (.mp4, .mov, .mkv, .webm)');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    }
  };

  // Add another timeline row
  const handleAddTimeline = () => {
    const last = timelines[timelines.length - 1];
    let nextStartSec = 0;
    if (last) {
      nextStartSec = hmsToSec(last.endHms);
    }
    const nextStartHms = secToHms(nextStartSec);
    const duration = 30;
    const nextEndHms = secToHms(nextStartSec + duration);
    const nextIndex = timelines.length + 1;

    setTimelines([
      ...timelines,
      {
        id: `timeline-${Date.now()}-${nextIndex}`,
        name: `Clip ${nextIndex.toString().padStart(2, '0')}`,
        startHms: nextStartHms,
        duration: duration,
        endHms: nextEndHms,
      },
    ]);
  };

  // Duplicate timeline
  const handleDuplicateTimeline = (index: number) => {
    const target = timelines[index];
    const nextStartSec = hmsToSec(target.endHms);
    const nextStartHms = secToHms(nextStartSec);
    const nextEndHms = secToHms(nextStartSec + target.duration);

    const copy: TimelineSegment = {
      id: `timeline-${Date.now()}`,
      name: `${target.name} (Copy)`,
      startHms: nextStartHms,
      duration: target.duration,
      endHms: nextEndHms,
    };

    const updated = [...timelines];
    updated.splice(index + 1, 0, copy);
    setTimelines(updated);
  };

  // Remove timeline (keeps at least 1 mandatory)
  const handleRemoveTimeline = (index: number) => {
    if (timelines.length <= 1) {
      setErrorMessage('At least one timestamp timeline is mandatory and required.');
      return;
    }
    const updated = timelines.filter((_, i) => i !== index);
    setTimelines(updated);
  };

  // Update specific timeline fields
  const handleUpdateTimeline = (
    index: number,
    field: 'name' | 'startHms' | 'duration',
    val: any
  ) => {
    const updated = [...timelines];
    const item = { ...updated[index] };

    if (field === 'name') {
      item.name = val;
    } else if (field === 'startHms') {
      item.startHms = val;
      const startSec = hmsToSec(val);
      item.endHms = secToHms(startSec + item.duration);
    } else if (field === 'duration') {
      const dur = Math.max(1, parseInt(val) || 1);
      item.duration = dur;
      const startSec = hmsToSec(item.startHms);
      item.endHms = secToHms(startSec + dur);
    }

    updated[index] = item;
    setTimelines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a project title');
      return;
    }

    // MANDATORY VALIDATION FOR TIMESTAMPS
    if (!timelines || timelines.length === 0) {
      setErrorMessage('Timestamp timeline is mandatory. Please provide at least one clipping timeline.');
      return;
    }

    for (let i = 0; i < timelines.length; i++) {
      const t = timelines[i];
      if (!t.startHms.trim() || !isValidHms(t.startHms)) {
        setErrorMessage(
          `Timeline #${i + 1} (${t.name || 'Clip'}): Start timestamp must be in format HH:MM:SS (e.g. 00:02:15) and cannot be empty.`
        );
        return;
      }
      if (t.duration <= 0) {
        setErrorMessage(`Timeline #${i + 1}: Duration must be at least 1 second.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setStatusMessage('Creating project workspace...');

      // 1. Create project
      const project = await api.createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        target_aspect_ratio: targetAspect,
      });

      // 2. Handle Video Source
      if (sourceType === 'upload' && selectedFile) {
        setStatusMessage('Uploading video and analyzing FFmpeg streams...');
        await api.uploadVideo(project.id, selectedFile);
      } else if (sourceType === 'youtube' && youtubeUrl.trim()) {
        setStatusMessage('Verifying YouTube reference and generating playback buffer...');
        await api.registerYouTube(project.id, youtubeUrl.trim());
      } else {
        setStatusMessage('Generating 1080p Studio Sample video via FFmpeg engine...');
        await api.generateSampleVideo(project.id, 60);
      }

      // 3. Create all configured multiple timeline clips in batch
      setStatusMessage(`Adding ${timelines.length} timestamp clip timelines...`);
      const batchPayload = timelines.map((t, idx) => ({
        name: t.name.trim() || `Clip ${(idx + 1).toString().padStart(2, '0')}`,
        start_time: hmsToSec(t.startHms),
        duration: t.duration,
        language: 'en',
      }));

      await api.createClipsBatch(project.id, batchPayload);

      setStatusMessage('Project setup completed! Redirecting to studio...');
      setTimeout(() => {
        onProjectCreated(project.id);
        onNavigate('studio');
      }, 500);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to initialize project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] pb-5">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white dark:text-white light:text-zinc-900">
          Create New Clipping Project
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
          Specify your source video, format, and mandatory start timestamps in <span className="font-mono text-brand-400">HH:MM:SS</span> format to generate multiple clips at once.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-950/40 border border-brand-800 text-brand-200 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-brand-400 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Project Details */}
        <div className="p-6 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-4">
          <h3 className="text-sm font-semibold text-white dark:text-white light:text-zinc-900 uppercase tracking-wider">
            1. Project Details
          </h3>

          <div>
            <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lex Fridman Ep. 450 – Highlights"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 text-white dark:text-white light:text-zinc-900 text-sm focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes on timestamps, topic tags, or editing instructions..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 text-white dark:text-white light:text-zinc-900 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Aspect Ratio Target */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-2">
              Target Output Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: '9:16', label: '9:16 Vertical', sub: 'Reels, Shorts, TikTok' },
                { id: '1:1', label: '1:1 Square', sub: 'Instagram, LinkedIn' },
                { id: '16:9', label: '16:9 Landscape', sub: 'YouTube Standard' },
                { id: 'custom', label: 'Custom', sub: 'Freeform Crop' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTargetAspect(opt.id as any)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    targetAspect === opt.id
                      ? 'bg-brand-600/15 border-brand-500 text-white dark:text-white light:text-zinc-900 font-semibold'
                      : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:border-zinc-500'
                  }`}
                >
                  <span className="block text-xs font-bold leading-tight">{opt.label}</span>
                  <span className="block text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Video Import Source */}
        <div className="p-6 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-4">
          <h3 className="text-sm font-semibold text-white dark:text-white light:text-zinc-900 uppercase tracking-wider">
            2. Video Source
          </h3>

          <div className="flex border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSourceType('upload')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
                sourceType === 'upload'
                  ? 'border-brand-500 text-brand-400 dark:text-brand-400 light:text-brand-700 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Direct Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('youtube')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
                sourceType === 'youtube'
                  ? 'border-brand-500 text-brand-400 dark:text-brand-400 light:text-brand-700 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Video className="w-4 h-4 text-red-500" />
              <span>YouTube Reference</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('sample')}
              className={`pb-2.5 flex items-center gap-2 border-b-2 transition-all ${
                sourceType === 'sample'
                  ? 'border-brand-500 text-brand-400 dark:text-brand-400 light:text-brand-700 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Studio Demo Video</span>
            </button>
          </div>

          {sourceType === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 hover:border-brand-500 rounded-xl p-8 cursor-pointer transition-colors bg-[#0A0A0A]/50 dark:bg-[#0A0A0A]/50 light:bg-zinc-50">
                <UploadCloud className="w-10 h-10 text-brand-400 mb-2 stroke-[1.5]" />
                <span className="text-xs font-semibold text-white dark:text-white light:text-zinc-900">
                  {selectedFile ? selectedFile.name : 'Click to select or drag video file here'}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
                  Supports MP4, MOV, MKV, WebM (up to 4K resolution)
                </span>
                {selectedFile && (
                  <span className="mt-3 px-2.5 py-1 rounded bg-brand-600/20 text-brand-300 text-xs font-medium">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB selected
                  </span>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {sourceType === 'youtube' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1.5">
                  YouTube Video Link
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 text-white dark:text-white light:text-zinc-900 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 leading-relaxed">
                <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Compliant Source Reference:</strong> Links official video metadata and timestamp coordinates for compliant studio editing.
                </p>
              </div>
            </div>
          )}

          {sourceType === 'sample' && (
            <div className="p-4 rounded-lg bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700 space-y-2">
              <div className="flex items-center gap-2 text-brand-400 font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Instant Studio Demo Generator</span>
              </div>
              <p className="leading-relaxed text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
                Uses the native FFmpeg engine to generate a 1080p landscape test video with dynamic visual timing grids and audio tones.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: MANDATORY TIMESTAMPS & TIMELINES */}
        <div className="p-6 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border-2 border-brand-500/40 dark:border-brand-500/40 light:border-brand-500/40 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
            <div>
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-brand-400" />
                <h3 className="text-sm font-bold text-white dark:text-white light:text-zinc-900 uppercase tracking-wider">
                  3. Timestamps & Timelines * <span className="text-brand-400 font-mono text-xs font-normal">(Required / Mandatory)</span>
                </h3>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
                Enter your start timestamp in <span className="font-mono text-white dark:text-white light:text-zinc-900 font-bold">HH:MM:SS</span> format so clipping starts from there. Add multiple timelines at once using the <span className="font-bold text-brand-400">+ Add Timeline</span> button.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddTimeline}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Timeline</span>
            </button>
          </div>

          {/* Timelines Rows */}
          <div className="space-y-3">
            {timelines.map((timeline, index) => (
              <div
                key={timeline.id}
                className="p-4 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-3"
              >
                {/* Timeline Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={timeline.name}
                      onChange={(e) => handleUpdateTimeline(index, 'name', e.target.value)}
                      placeholder={`Clip ${(index + 1).toString().padStart(2, '0')}`}
                      className="px-2 py-1 rounded bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs font-semibold text-white dark:text-white light:text-zinc-900 focus:outline-none focus:border-brand-500 w-44"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTimeline(index)}
                      className="p-1.5 rounded hover:bg-[#1C1C1C] dark:hover:bg-[#1C1C1C] light:hover:bg-zinc-200 text-zinc-400 hover:text-white transition-colors"
                      title="Duplicate this timeline"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeline(index)}
                      disabled={timelines.length <= 1}
                      className="p-1.5 rounded hover:bg-red-900/40 text-zinc-400 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title={timelines.length <= 1 ? 'At least one timeline is required' : 'Delete timeline'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Timestamp Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Start Timestamp (HH:MM:SS) - MANDATORY */}
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1">
                      Start Timestamp (HH:MM:SS) * <span className="text-red-400 font-bold">Required</span>
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-brand-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={timeline.startHms}
                        onChange={(e) => handleUpdateTimeline(index, 'startHms', e.target.value)}
                        placeholder="00:02:15"
                        pattern="^(?:(?:[0-9]{1,2}:)?[0-5]?[0-9]:[0-5][0-9])$"
                        className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 text-white dark:text-white light:text-zinc-900 font-mono text-xs focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5 block">
                      Clipping starts from this exact second
                    </span>
                  </div>

                  {/* Duration (Seconds) */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-1">
                      Duration (Seconds) *
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="number"
                        min="1"
                        required
                        value={timeline.duration}
                        onChange={(e) => handleUpdateTimeline(index, 'duration', e.target.value)}
                        className="w-20 px-2.5 py-2 rounded-lg bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 text-white dark:text-white light:text-zinc-900 font-mono text-xs focus:outline-none focus:border-brand-500"
                      />
                      <div className="flex gap-1">
                        {[15, 30, 60].map((dur) => (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => handleUpdateTimeline(index, 'duration', dur)}
                            className={`px-2 py-1.5 rounded font-mono text-[10px] font-semibold transition-colors ${
                              timeline.duration === dur
                                ? 'bg-brand-600 text-white'
                                : 'bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-200 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white'
                            }`}
                          >
                            {dur}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Auto-Calculated End Timestamp */}
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-1">
                      End Timestamp
                    </label>
                    <div className="px-3 py-2 rounded-lg bg-[#141414] dark:bg-[#141414] light:bg-zinc-100 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-300 dark:text-zinc-300 light:text-zinc-800 font-mono text-xs font-semibold text-center">
                      {timeline.endHms}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Large "+ Add Another Timeline" Button */}
          <button
            type="button"
            onClick={handleAddTimeline}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 hover:border-brand-500 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-brand-400 text-xs font-semibold transition-all bg-[#0A0A0A]/40"
          >
            <Plus className="w-4 h-4 text-brand-400" />
            <span>+ Add Another Timeline ({timelines.length} Timelines Added)</span>
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2.5 rounded-lg border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 text-xs font-semibold hover:bg-[#1C1C1C] dark:hover:bg-[#1C1C1C] light:hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <span>{isSubmitting ? 'Initializing Workspace...' : `Launch Studio with ${timelines.length} Clip Timelines`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
