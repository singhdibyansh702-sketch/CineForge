import React, { useState, useEffect } from 'react';
import {
  Type,
  Plus,
  Trash2,
  Sparkles,
  Check,
  BookmarkPlus,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { CaptionPreset, CaptionStyleName, CaptionPosition, CaptionAnimation } from '../types';

export const CaptionPresets: React.FC = () => {
  const [presets, setPresets] = useState<CaptionPreset[]>([]);
  const [loading, setLoading] = useState(true);

  // New Preset Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [styleName, setStyleName] = useState<CaptionStyleName>('karaoke');
  const [fontSize, setFontSize] = useState(30);
  const [primaryColor, setPrimaryColor] = useState('#FFFFFF');
  const [highlightColor, setHighlightColor] = useState('#A855F7');
  const [bgColor, setBgColor] = useState('rgba(0,0,0,0.7)');
  const [position, setPosition] = useState<CaptionPosition>('bottom');
  const [animationType, setAnimationType] = useState<CaptionAnimation>('word');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const data = await api.getPresets();
      setPresets(data);
    } catch (err) {
      console.error('Failed to load presets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createPreset({
        name: name.trim(),
        style_name: styleName,
        font_size: fontSize,
        primary_color: primaryColor,
        highlight_color: highlightColor,
        bg_color: bgColor,
        position,
        animation_type: animationType,
      });
      setIsCreating(false);
      setName('');
      loadPresets();
    } catch (err: any) {
      alert(err.message || 'Failed to save preset');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom preset?')) return;
    try {
      await api.deletePreset(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete preset');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2A2A2A] dark:border-[#2A2A2A] light:border-[#E5E7EB]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white dark:text-white light:text-zinc-900">
            Caption Presets Library
          </h2>
          <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-1">
            Standard and custom subtitle styling configurations with word-by-word karaoke animations and typography controls.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Caption Style</span>
        </button>
      </div>

      {/* Preset Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-zinc-400">Loading caption presets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="p-5 rounded-xl bg-[#141414] dark:bg-[#141414] light:bg-white border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-200 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-white dark:text-white light:text-zinc-900">
                    {preset.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      preset.is_system_preset
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-brand-600/20 text-brand-300'
                    }`}
                  >
                    {preset.is_system_preset ? 'System' : 'Custom'}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mb-4 capitalize">
                  {preset.style_name} style • {preset.animation_type} animation • {preset.position} placement
                </p>

                {/* Visual Preview Box */}
                <div className="p-4 rounded-lg bg-[#0A0A0A] dark:bg-[#0A0A0A] light:bg-zinc-900 text-center relative overflow-hidden min-h-[90px] flex items-center justify-center border border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-800">
                  <div
                    style={{
                      backgroundColor: preset.style_name === 'box' ? preset.bg_color : 'transparent',
                      padding: preset.style_name === 'box' ? '4px 12px' : '0px',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        color: preset.primary_color,
                        fontSize: '15px',
                        fontWeight: 'bold',
                        marginRight: '6px',
                      }}
                    >
                      Turn
                    </span>
                    <span
                      style={{
                        color: preset.highlight_color,
                        fontSize: '16px',
                        fontWeight: '800',
                      }}
                    >
                      Viral
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-3 border-t border-[#2A2A2A] dark:border-[#2A2A2A] light:border-zinc-100">
                <span className="font-mono text-[11px]">{preset.font_size}px Font</span>
                {!preset.is_system_preset && (
                  <button
                    onClick={() => handleDelete(preset.id)}
                    className="p-1.5 rounded hover:bg-red-900/30 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete custom preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Preset Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#2A2A2A] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Caption Style Preset</h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1">Preset Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neon Karaoke Glow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1">Style Template</label>
                <select
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#2A2A2A] text-white focus:outline-none"
                >
                  <option value="karaoke">Karaoke (Word-by-word color shift)</option>
                  <option value="highlight">Highlight (Active word scale & color)</option>
                  <option value="box">Box (Solid contrast pill background)</option>
                  <option value="bold">Bold (Heavy stroke punchy typography)</option>
                  <option value="clean">Clean (Modern minimalist sans-serif)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 mb-1">Highlight Color</label>
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-full h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
