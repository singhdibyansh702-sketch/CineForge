import React, { useState, useRef, useEffect } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scan,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { CropSetting, AspectRatioType, CropPresetMode, SourceVideo } from '../types';
import { resolveMediaUrl } from '../api/client';

interface CropEditorProps {
  sourceVideo?: SourceVideo | null;
  cropSetting?: CropSetting;
  onUpdate: (updated: CropSetting) => void;
  videoCurrentTime?: number;
}

export const CropEditor: React.FC<CropEditorProps> = ({
  sourceVideo,
  cropSetting,
  onUpdate,
  videoCurrentTime = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>(cropSetting?.aspect_ratio || '9:16');
  const [presetMode, setPresetMode] = useState<CropPresetMode>(cropSetting?.preset_mode || 'center');
  const [zoomLevel, setZoomLevel] = useState<number>(cropSetting?.zoom_level || 1.0);
  const [cropX, setCropX] = useState<number>(cropSetting?.crop_x || 0.35); // 0.0 - 1.0 normalized
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  // Sync state if cropSetting prop changes
  useEffect(() => {
    if (cropSetting) {
      setAspectRatio(cropSetting.aspect_ratio);
      setPresetMode(cropSetting.preset_mode);
      setZoomLevel(cropSetting.zoom_level);
      setCropX(cropSetting.crop_x || 0.35);
    }
  }, [cropSetting]);

  // Handle Presets
  const applyPreset = (mode: CropPresetMode) => {
    setPresetMode(mode);
    let newX = 0.35;
    if (mode === 'left') {
      newX = 0.05;
    } else if (mode === 'right') {
      newX = 0.65;
    } else if (mode === 'center') {
      newX = 0.35;
    }
    setCropX(newX);
    onUpdate({
      aspect_ratio: aspectRatio,
      crop_x: newX,
      crop_y: 0.0,
      crop_width: 0.5625 / zoomLevel, // 9/16 normalized
      crop_height: 1.0 / zoomLevel,
      zoom_level: zoomLevel,
      preset_mode: mode,
    });
  };

  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(1.0, Math.min(2.5, newZoom));
    setZoomLevel(clamped);
    onUpdate({
      aspect_ratio: aspectRatio,
      crop_x: cropX,
      crop_y: 0.0,
      crop_width: 0.5625 / clamped,
      crop_height: 1.0 / clamped,
      zoom_level: clamped,
      preset_mode: presetMode,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - startX) / rect.width;
    const frameWidth = (aspectRatio === '9:16' ? 0.31 : aspectRatio === '1:1' ? 0.56 : 0.8) / zoomLevel;
    const maxBound = Math.max(0, 1.0 - frameWidth);
    const updatedX = Math.max(0, Math.min(maxBound, cropX + deltaX));
    setCropX(updatedX);
    setStartX(e.clientX);
    setPresetMode('custom');
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onUpdate({
        aspect_ratio: aspectRatio,
        crop_x: cropX,
        crop_y: 0.0,
        crop_width: 0.5625 / zoomLevel,
        crop_height: 1.0 / zoomLevel,
        zoom_level: zoomLevel,
        preset_mode: 'custom',
      });
    }
  };

  // Simulated auto speaker face tracking
  const handleAutoTrack = () => {
    setPresetMode('center');
    setCropX(0.35);
    setZoomLevel(1.15);
    onUpdate({
      aspect_ratio: '9:16',
      crop_x: 0.35,
      crop_y: 0.0,
      crop_width: 0.5625 / 1.15,
      crop_height: 1.0 / 1.15,
      zoom_level: 1.15,
      preset_mode: 'center',
    });
  };

  // Calculate crop box width percentage based on aspect ratio
  const cropBoxWidthPct = (aspectRatio === '9:16' ? 31.6 : aspectRatio === '1:1' ? 56.25 : 85) / zoomLevel;

  return (
    <div className="space-y-4 select-none">
      {/* Aspect Ratio & Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs">
        {/* Aspect Ratio Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-500 font-medium mr-1">Aspect:</span>
          {[
            { id: '9:16' as AspectRatioType, label: '9:16 Reel' },
            { id: '1:1' as AspectRatioType, label: '1:1 Square' },
            { id: '16:9' as AspectRatioType, label: '16:9 Fit' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setAspectRatio(item.id);
                onUpdate({
                  aspect_ratio: item.id,
                  crop_x: cropX,
                  crop_y: 0.0,
                  crop_width: 1.0,
                  crop_height: 1.0,
                  zoom_level: zoomLevel,
                  preset_mode: presetMode,
                });
              }}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                aspectRatio === item.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Framing Presets (Left, Center, Right) */}
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-500 font-medium mr-1">Position:</span>
          <button
            onClick={() => applyPreset('left')}
            className={`p-1.5 rounded-md font-medium text-xs flex items-center gap-1 ${
              presetMode === 'left'
                ? 'bg-brand-600 text-white'
                : 'bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white'
            }`}
            title="Left Preset (Speaker 1)"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Left</span>
          </button>

          <button
            onClick={() => applyPreset('center')}
            className={`p-1.5 rounded-md font-medium text-xs flex items-center gap-1 ${
              presetMode === 'center'
                ? 'bg-brand-600 text-white'
                : 'bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white'
            }`}
            title="Center Preset (Balanced)"
          >
            <AlignCenter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Center</span>
          </button>

          <button
            onClick={() => applyPreset('right')}
            className={`p-1.5 rounded-md font-medium text-xs flex items-center gap-1 ${
              presetMode === 'right'
                ? 'bg-brand-600 text-white'
                : 'bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white'
            }`}
            title="Right Preset (Speaker 2)"
          >
            <AlignRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Right</span>
          </button>

          {/* AI Auto Track */}
          <button
            onClick={handleAutoTrack}
            className="p-1.5 rounded-md bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 font-semibold text-[11px] flex items-center gap-1 border border-brand-500/30 transition-colors ml-1"
            title="AI Speaker Center Detection"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden md:inline">Smart Center</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <ZoomOut
            className="w-3.5 h-3.5 text-zinc-400 cursor-pointer hover:text-white"
            onClick={() => handleZoomChange(zoomLevel - 0.1)}
          />
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.05"
            value={zoomLevel}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="w-20 accent-brand-500 cursor-pointer h-1"
          />
          <ZoomIn
            className="w-3.5 h-3.5 text-zinc-400 cursor-pointer hover:text-white"
            onClick={() => handleZoomChange(zoomLevel + 0.1)}
          />
          <span className="text-[11px] font-mono text-zinc-300 w-8">{zoomLevel.toFixed(1)}x</span>
        </div>
      </div>

      {/* Main Canvas & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Original 16:9 Canvas with Draggable Crop Box */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span className="font-medium">16:9 Source Framing Frame (Drag to reposition)</span>
            <span className="font-mono text-[11px]">X: {(cropX * 100).toFixed(0)}%</span>
          </div>

          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-full aspect-video rounded-xl bg-black overflow-hidden border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 shadow-inner group"
          >
            {sourceVideo ? (
              <video
                src={resolveMediaUrl(sourceVideo.stream_url)}
                className="w-full h-full object-contain pointer-events-none"
                playsInline
                muted
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                No video loaded
              </div>
            )}

            {/* Dark Mask for Non-Cropped Areas */}
            <div className="absolute inset-0 bg-black/55 pointer-events-none" />

            {/* Draggable Active Crop Frame */}
            <div
              onMouseDown={handleMouseDown}
              style={{
                left: `${cropX * 100}%`,
                width: `${cropBoxWidthPct}%`,
              }}
              className="absolute top-0 bottom-0 border-2 border-brand-500 bg-transparent cursor-grab active:cursor-grabbing shadow-2xl transition-all duration-75"
            >
              {/* Center crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <Scan className="w-8 h-8 text-brand-300" />
              </div>

              {/* Tag pill */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-brand-600 text-white font-bold text-[9px] uppercase tracking-wider pointer-events-none">
                {aspectRatio}
              </div>

              {/* Left/Right handle indicators */}
              <div className="absolute top-1/2 -left-1 w-2 h-6 -translate-y-1/2 bg-brand-400 rounded-full" />
              <div className="absolute top-1/2 -right-1 w-2 h-6 -translate-y-1/2 bg-brand-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right: Real-time 9:16 Vertical Preview Output */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-zinc-400 px-1">
            <span className="font-semibold text-white dark:text-white light:text-zinc-900 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-brand-400" />
              Live 9:16 Preview
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">1080x1920</span>
          </div>

          <div className="w-[180px] h-[320px] rounded-2xl bg-black border-2 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 overflow-hidden relative shadow-xl flex items-center justify-center">
            {sourceVideo ? (
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: `${cropX * 100 + (cropBoxWidthPct / 2)}% center`,
                }}
              >
                <video
                  src={resolveMediaUrl(sourceVideo.stream_url)}
                  className="absolute top-0 bottom-0 h-full max-w-none"
                  style={{
                    left: `-${cropX * 320 * (16 / 9)}px`,
                    width: `${320 * (16 / 9)}px`,
                  }}
                  playsInline
                  muted
                />
              </div>
            ) : (
              <span className="text-[11px] text-zinc-500">Preview</span>
            )}

            {/* Mobile Device Bezel Overlay */}
            <div className="absolute top-2 w-12 h-1 rounded-full bg-zinc-800/80 pointer-events-none" />
            <div className="absolute bottom-1.5 w-16 h-1 rounded-full bg-zinc-800/80 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
