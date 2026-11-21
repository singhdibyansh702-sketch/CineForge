import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  FileArchive,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api, resolveMediaUrl } from '../api/client';
import { ExportJob, Clip, Project } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  selectedClip?: Clip | null; // if null, batch export all clips
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  selectedClip
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4k'>('1080p');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9' | 'custom'>('9:16');
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [upscaleWarning, setUpscaleWarning] = useState<string | null>(null);

  // Check source resolution for upscale warning
  useEffect(() => {
    if (project?.source_video) {
      const sourceH = project.source_video.height || 1080;
      const targetH = resolution === '4k' ? 2160 : resolution === '1440p' ? 1440 : resolution === '1080p' ? 1080 : 720;
      if (targetH > sourceH) {
        setUpscaleWarning(
          `Upscale Notice: Output resolution (${resolution}) exceeds source resolution (${sourceH}p). Visual sharpness may be softened.`
        );
      } else {
        setUpscaleWarning(null);
      }
    }
  }, [resolution, project]);

  // Poll job status
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const jobData = await api.getExportJob(jobId);
        setJob(jobData);
        if (jobData.status === 'completed' || jobData.status === 'failed') {
          setIsExporting(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Failed to poll job:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    try {
      setIsExporting(true);
      const res = await api.triggerExport({
        project_id: project.id,
        clip_id: selectedClip ? selectedClip.id : null,
        resolution,
        fps,
        aspect_ratio: aspectRatio,
        format: 'mp4',
      });
      setJobId(res.job_id);
    } catch (err: any) {
      alert(err.message || 'Failed to start export');
      setIsExporting(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = resolveMediaUrl(url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 overflow-hidden shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <div>
            <h3 className="text-base font-bold text-white dark:text-white light:text-zinc-900">
              {selectedClip ? `Export "${selectedClip.name}"` : `Batch Export All Clips (${project.clips?.length || 0})`}
            </h3>
            <span className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500">
              Native FFmpeg video encoding engine
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-zinc-900 hover:bg-[#1C1C1C] dark:hover:bg-[#1C1C1C] light:hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {upscaleWarning && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{upscaleWarning}</span>
            </div>
          )}

          {/* Active Job Progress View */}
          {jobId && job ? (
            <div className="p-5 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 flex items-center gap-2">
                  {job.status === 'processing' && <Clock className="w-4 h-4 text-brand-400 animate-spin" />}
                  {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {job.status === 'failed' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  Status: <span className="uppercase text-white dark:text-white light:text-zinc-900">{job.status}</span>
                </span>
                <span className="text-sm font-bold font-mono text-brand-400">
                  {Math.round(job.progress)}%
                </span>
              </div>

              {/* Real Progress Bar */}
              <div className="w-full h-2.5 rounded-full bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-200 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, job.progress)}%` }}
                />
              </div>

              {/* Completed Files */}
              {job.status === 'completed' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-medium text-emerald-400">
                    Render finished successfully! Ready to download:
                  </p>

                  {job.zip_bundle_url && (
                    <button
                      onClick={() => handleDownload(job.zip_bundle_url!, 'All_Clips_Bundle.zip')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      <FileArchive className="w-4 h-4" />
                      <span>Download All Clips (ZIP Bundle)</span>
                    </button>
                  )}

                  <div className="space-y-1.5 pt-1">
                    {job.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs"
                      >
                        <span className="font-mono text-zinc-300 dark:text-zinc-300 light:text-zinc-700 truncate max-w-[240px]">
                          {file.filename}
                        </span>
                        <button
                          onClick={() => handleDownload(file.download_url, file.filename)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 hover:bg-brand-600 text-zinc-200 dark:text-zinc-200 light:text-zinc-800 hover:text-white font-semibold text-[11px] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{file.file_size_formatted}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {job.status === 'failed' && (
                <p className="text-xs text-red-400">
                  {job.error_message || 'Video processing encountered an error during FFmpeg execution.'}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Resolution Grid */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-2">
                  Resolution
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['720p', '1080p', '1440p', '4k'] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResolution(res)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        resolution === res
                          ? 'bg-brand-600/20 border-brand-500 text-brand-300 light:bg-brand-50 light:text-brand-700'
                          : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {res.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Framerate Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-2">
                  Frame Rate (FPS)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([24, 30, 60] as const).map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setFps(rate)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        fps === rate
                          ? 'bg-brand-600/20 border-brand-500 text-brand-300 light:bg-brand-50 light:text-brand-700'
                          : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {rate} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '9:16', label: '9:16 (Vertical)' },
                    { id: '1:1', label: '1:1 (Square)' },
                    { id: '16:9', label: '16:9 (Landscape)' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id as any)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        aspectRatio === ratio.id
                          ? 'bg-brand-600/20 border-brand-500 text-brand-300 light:bg-brand-50 light:text-brand-700'
                          : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Codec & Specs */}
              <div className="p-3.5 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 space-y-1">
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-medium">MP4 (MPEG-4 Part 14)</span>
                </div>
                <div className="flex justify-between">
                  <span>Video Codec:</span>
                  <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-medium">H.264 / AVC (libx264)</span>
                </div>
                <div className="flex justify-between">
                  <span>Audio Codec:</span>
                  <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-medium">AAC Stereo (192 kbps)</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtitles:</span>
                  <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-medium">Burned-in High Res ASS</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 bg-[#0A0A0A]/50 dark:bg-[#0A0A0A]/50 light:bg-zinc-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-zinc-900 transition-colors"
          >
            {job?.status === 'completed' ? 'Close' : 'Cancel'}
          </button>

          {!jobId && (
            <button
              onClick={handleStartExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Render</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
