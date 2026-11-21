import React, { useState, useEffect } from 'react';
import {
  Download,
  Film,
  Calendar,
  CheckCircle2,
  HardDrive,
  FileArchive,
  ExternalLink
} from 'lucide-react';
import { api, resolveMediaUrl } from '../api/client';
import { ExportFile } from '../types';

export const ExportHistory: React.FC = () => {
  const [history, setHistory] = useState<ExportFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getExportHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load export history:', err);
    } finally {
      setLoading(false);
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
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB] pb-5">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white dark:text-white light:text-zinc-900">
          Export History & Downloads
        </h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
          Access all your previously rendered vertical and square MP4 video clips and batch ZIP files.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-400">Loading export archives...</div>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-600"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-600/15 border border-brand-500/30 text-brand-400 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white dark:text-white light:text-zinc-900 line-clamp-1">
                    {item.clip_name || item.filename}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400">
                    <span className="font-mono">{item.filename}</span>
                    <span>•</span>
                    <span className="font-bold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 uppercase">{item.resolution}</span>
                    <span>•</span>
                    <span>{item.file_size_formatted}</span>
                    <span>•</span>
                    <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleDownload(item.download_url, item.filename)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download MP4</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
          <HardDrive className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white dark:text-white light:text-zinc-900 mb-1">
            No exported clips yet
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 max-w-sm mx-auto">
            Once you generate clips from the studio, your rendered files and ZIP packages will appear here for download.
          </p>
        </div>
      )}
    </div>
  );
};
