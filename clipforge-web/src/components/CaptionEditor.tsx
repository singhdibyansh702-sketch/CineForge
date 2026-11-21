import React, { useState, useEffect } from 'react';
import {
  Type,
  Sparkles,
  Save,
  Languages,
  Play,
  RotateCcw,
  Check,
  Palette,
  Sliders,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  BookmarkPlus
} from 'lucide-react';
import {
  CaptionPreset,
  CaptionStyleName,
  CaptionPosition,
  CaptionAnimation,
  SubtitleSegment,
  Clip
} from '../types';
import { api } from '../api/client';

interface CaptionEditorProps {
  clip: Clip;
  presets: CaptionPreset[];
  onUpdatePreset: (presetId: string) => void;
  onRefreshClip: () => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  clip,
  presets,
  onUpdatePreset,
  onRefreshClip
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'hi-en'>(clip.language || 'en');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Custom caption parameters
  const activePreset = clip.caption_preset || presets[0];
  const [styleName, setStyleName] = useState<CaptionStyleName>(activePreset?.style_name || 'karaoke');
  const [fontSize, setFontSize] = useState<number>(activePreset?.font_size || 28);
  const [primaryColor, setPrimaryColor] = useState<string>(activePreset?.primary_color || '#FFFFFF');
  const [highlightColor, setHighlightColor] = useState<string>(activePreset?.highlight_color || '#A855F7');
  const [bgColor, setBgColor] = useState<string>(activePreset?.bg_color || 'rgba(0,0,0,0.7)');
  const [position, setPosition] = useState<CaptionPosition>(activePreset?.position || 'bottom');
  const [animationType, setAnimationType] = useState<CaptionAnimation>(activePreset?.animation_type || 'word');

  // Segments for manual subtitle editing
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Parse existing subtitles
  useEffect(() => {
    if (clip.subtitles_json) {
      try {
        const parsed = JSON.parse(clip.subtitles_json);
        setSegments(parsed);
      } catch (e) {
        setSegments([]);
      }
    }
  }, [clip.subtitles_json]);

  // Animated live preview timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % 6);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const handleTranscribe = async () => {
    try {
      setIsTranscribing(true);
      const res = await api.autoTranscribe(clip.id, selectedLanguage);
      setSegments(res.segments);
      onRefreshClip();
    } catch (err: any) {
      alert(err.message || 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveSubtitles = async () => {
    try {
      await api.updateSubtitles(clip.id, segments);
      alert('Subtitles saved successfully!');
      onRefreshClip();
    } catch (err: any) {
      alert(err.message || 'Failed to save subtitles');
    }
  };

  const handleSaveAsPreset = async () => {
    if (!newPresetName.trim()) return;
    try {
      await api.createPreset({
        name: newPresetName.trim(),
        style_name: styleName,
        font_size: fontSize,
        primary_color: primaryColor,
        highlight_color: highlightColor,
        bg_color: bgColor,
        position: position,
        animation_type: animationType,
      });
      alert('Caption style saved to presets!');
      setIsSavingPreset(false);
      setNewPresetName('');
    } catch (err: any) {
      alert(err.message || 'Failed to save preset');
    }
  };

  const previewWords = selectedLanguage === 'hi'
    ? ['इस', 'वीडियो', 'को', 'तुरंत', 'लाइक', 'करें']
    : selectedLanguage === 'hi-en'
    ? ['Yeh', 'video', 'clip', 'bahut', 'viral', 'hogi']
    : ['Creating', 'viral', 'clips', 'with', 'dynamic', 'captions'];

  return (
    <div className="space-y-5">
      {/* Top Controls: Language & Presets */}
      <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-semibold text-white dark:text-white light:text-zinc-900">
              Speech Transcription Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-100 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-300 text-xs text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-medium focus:outline-none"
            >
              <option value="en">English (US/UK)</option>
              <option value="hi">Hindi (हिन्दी / देवनागरी)</option>
              <option value="hi-en">Hinglish (Hindi in Roman)</option>
            </select>

            <button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTranscribing ? 'Transcribing...' : 'Auto Transcribe'}</span>
            </button>
          </div>
        </div>

        {/* Caption Preset Picker */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-2">
            Choose Quick Preset:
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setStyleName(preset.style_name);
                  setFontSize(preset.font_size);
                  setPrimaryColor(preset.primary_color);
                  setHighlightColor(preset.highlight_color);
                  setPosition(preset.position);
                  setAnimationType(preset.animation_type);
                  onUpdatePreset(preset.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  clip.caption_preset_id === preset.id || styleName === preset.style_name
                    ? 'bg-brand-600/20 border-brand-500 text-brand-300 font-semibold'
                    : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Subtitle Typography Preview Canvas */}
      <div className="p-6 rounded-xl bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-900 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-800 text-center relative overflow-hidden min-h-[140px] flex flex-col justify-center items-center">
        <span className="absolute top-2 left-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Live Animated Caption Preview
        </span>

        {/* Animated Subtitle Box */}
        <div
          style={{
            backgroundColor: styleName === 'box' ? bgColor : 'transparent',
            padding: styleName === 'box' ? '8px 16px' : '4px',
            borderRadius: '8px',
          }}
          className="inline-block transition-all"
        >
          <p
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: styleName === 'bold' || styleName === 'karaoke' ? '800' : '600',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
            className="tracking-wide"
          >
            {previewWords.map((word, idx) => {
              const isCurrent = idx === activeWordIndex;
              const isHighlighted = isCurrent || animationType === 'sentence';
              return (
                <span
                  key={idx}
                  style={{
                    color: isHighlighted ? highlightColor : primaryColor,
                    transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
                    display: 'inline-block',
                    marginRight: '8px',
                    transition: 'all 0.15s ease-out',
                  }}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>

        <div className="absolute bottom-2 right-3 text-[10px] text-zinc-500 font-mono">
          Style: {styleName.toUpperCase()} • {animationType.toUpperCase()}
        </div>
      </div>

      {/* Style & Typography Customizer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Styles & Typography */}
        <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-3.5 text-xs">
          <span className="font-semibold text-white dark:text-white light:text-zinc-900 uppercase tracking-wider block">
            Typography & Style
          </span>

          {/* Style Pills */}
          <div>
            <label className="block text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-1.5">Style</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['karaoke', 'highlight', 'box', 'bold', 'clean', 'minimal'] as CaptionStyleName[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStyleName(s)}
                  className={`py-1.5 rounded-md font-semibold capitalize border transition-all ${
                    styleName === s
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex justify-between text-zinc-400 mb-1">
              <span>Font Size</span>
              <span className="font-mono text-zinc-200">{fontSize}px</span>
            </div>
            <input
              type="range"
              min="18"
              max="42"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full accent-brand-500 cursor-pointer h-1"
            />
          </div>

          {/* Color Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-zinc-300">{primaryColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Highlight Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={highlightColor}
                  onChange={(e) => setHighlightColor(e.target.value)}
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-zinc-300">{highlightColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Positioning & Animation */}
        <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-3.5 text-xs">
          <span className="font-semibold text-white dark:text-white light:text-zinc-900 uppercase tracking-wider block">
            Position & Animation
          </span>

          {/* Vertical Position */}
          <div>
            <label className="block text-zinc-400 mb-1.5">Vertical Placement</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'top' as CaptionPosition, label: 'Top', icon: AlignVerticalJustifyStart },
                { id: 'center' as CaptionPosition, label: 'Center', icon: AlignVerticalJustifyCenter },
                { id: 'bottom' as CaptionPosition, label: 'Bottom', icon: AlignVerticalJustifyEnd },
              ].map((pos) => {
                const Icon = pos.icon;
                return (
                  <button
                    key={pos.id}
                    onClick={() => setPosition(pos.id)}
                    className={`py-1.5 rounded-md font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      position === pos.id
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{pos.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animation Type */}
          <div>
            <label className="block text-zinc-400 mb-1.5">Caption Animation</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'word' as CaptionAnimation, label: 'Word-by-word' },
                { id: 'sentence' as CaptionAnimation, label: 'Sentence' },
                { id: 'static' as CaptionAnimation, label: 'Static' },
              ].map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => setAnimationType(anim.id)}
                  className={`py-1.5 rounded-md font-semibold text-[11px] border transition-all ${
                    animationType === anim.id
                      ? 'bg-brand-600 text-white border-brand-500'
                      : 'bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-400 hover:text-white'
                  }`}
                >
                  {anim.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save as Reusable Preset */}
          <div className="pt-2 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200">
            {isSavingPreset ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Preset name (e.g. My Neon Box)"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white text-xs"
                />
                <button
                  onClick={handleSaveAsPreset}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsSavingPreset(false)}
                  className="px-2 py-1.5 text-zinc-400 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSavingPreset(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1C1C1C] dark:bg-[#1C1C1C] light:bg-zinc-100 hover:bg-brand-600/20 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-brand-300 text-xs font-medium border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 transition-colors"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save Style as Reusable Preset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Subtitle Segment Editor */}
      <div className="p-4 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-semibold text-white dark:text-white light:text-zinc-900">
              Manual Subtitle Transcript Editor ({segments.length} segments)
            </span>
          </div>

          <button
            onClick={handleSaveSubtitles}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Subtitle Edits</span>
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {segments.map((seg, idx) => (
            <div
              key={seg.id || idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-50 border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-xs"
            >
              <span className="font-mono text-[10px] text-zinc-500 pt-2 shrink-0">
                {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
              </span>
              <textarea
                value={seg.text}
                onChange={(e) => {
                  const updated = [...segments];
                  updated[idx].text = e.target.value;
                  setSegments(updated);
                }}
                rows={1}
                className="flex-1 px-2.5 py-1 rounded bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 text-zinc-200 dark:text-zinc-200 light:text-zinc-900 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
