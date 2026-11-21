import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { ThemeColors } from '../constants/theme';
import { Project, Clip, CaptionPreset } from '../types';
import { mobileApi } from '../services/api';

interface StudioScreenProps {
  theme: ThemeColors;
  projectId: string | null;
  onNavigateTab: (tab: string) => void;
}

export const StudioScreen: React.FC<StudioScreenProps> = ({
  theme,
  projectId,
  onNavigateTab
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Studio tabs: Timestamps | Crop | Captions
  const [studioTab, setStudioTab] = useState<'timestamps' | 'crop' | 'captions'>('timestamps');

  // New clip form
  const [clipName, setClipName] = useState('');
  const [clipStartSec, setClipStartSec] = useState(0);
  const [clipDuration, setClipDuration] = useState(30);

  // Subtitle state
  const [language, setLanguage] = useState<'en' | 'hi' | 'hi-en'>('en');
  const [transcribing, setTranscribing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    } else {
      // Find latest project
      mobileApi.getProjects().then((projs) => {
        if (projs.length > 0) {
          loadProject(projs[0].id);
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));
    }
  }, [projectId]);

  const loadProject = async (id: string) => {
    try {
      setLoading(true);
      const proj = await mobileApi.getProject(id);
      const clipList = await mobileApi.getClips(id);
      setProject(proj);
      setClips(clipList);
      if (clipList.length > 0) {
        setSelectedClipId(clipList[0].id);
      }
    } catch (e) {
      console.warn('Load studio project error', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedClip = clips.find((c) => c.id === selectedClipId) || clips[0];

  const formatHms = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddClip = async () => {
    if (!project) return;
    try {
      const name = clipName.trim() || `Clip ${(clips.length + 1).toString().padStart(2, '0')}`;
      await mobileApi.createClip({
        project_id: project.id,
        name,
        start_time: clipStartSec,
        duration: clipDuration,
        language,
      });
      const updated = await mobileApi.getClips(project.id);
      setClips(updated);
      setSelectedClipId(updated[updated.length - 1].id);
      setClipStartSec(clipStartSec + clipDuration);
      setClipName('');
      Alert.alert('Clip Added', `${name} created (${clipDuration}s)`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add clip');
    }
  };

  const handleDuplicate = async (clipId: string) => {
    try {
      await mobileApi.duplicateClip(clipId);
      if (project) {
        const updated = await mobileApi.getClips(project.id);
        setClips(updated);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (clipId: string) => {
    try {
      await mobileApi.deleteClip(clipId);
      setClips((prev) => prev.filter((c) => c.id !== clipId));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleTranscribe = async () => {
    if (!selectedClip) return;
    try {
      setTranscribing(true);
      await mobileApi.autoTranscribe(selectedClip.id, language);
      if (project) {
        const updated = await mobileApi.getClips(project.id);
        setClips(updated);
      }
      Alert.alert('Success', `Speech transcribed in ${language.toUpperCase()}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  };

  const handleBatchExport = async () => {
    if (!project) return;
    try {
      setExporting(true);
      const res = await mobileApi.triggerExport(project.id, null, '1080p');
      Alert.alert(
        'Export Enqueued!',
        `FFmpeg background worker is rendering all ${clips.length} clips in 1080p vertical H.264 MP4.`
      );
      onNavigateTab('exports');
    } catch (e: any) {
      Alert.alert('Export Error', e.message || 'Failed to start export');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No project selected.</Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.accent, marginTop: 16 }]}
          onPress={() => onNavigateTab('projects')}
        >
          <Text style={styles.primaryBtnText}>Select a Project</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Studio Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.projTitle, { color: theme.text }]} numberOfLines={1}>
            {project.title}
          </Text>
          <Text style={[styles.projMeta, { color: theme.textMuted }]}>
            {clips.length} Clips • {project.target_aspect_ratio} Target
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.exportAllBtn, { backgroundColor: theme.accent }]}
          onPress={handleBatchExport}
          disabled={exporting || clips.length === 0}
        >
          <Text style={styles.exportAllText}>{exporting ? 'Rendering...' : 'Export All'}</Text>
        </TouchableOpacity>
      </View>

      {/* Simulated Mobile Video Framing Viewport */}
      <View style={[styles.viewportCard, { backgroundColor: '#000000', borderColor: theme.border }]}>
        <View style={styles.phoneFrame}>
          <Text style={styles.phoneIndicator}>9:16 Vertical Live Preview</Text>
          <View style={styles.faceTargetBox}>
            <Text style={styles.faceTargetText}>
              {selectedClip?.crop_setting?.preset_mode?.toUpperCase() || 'CENTER'} CROP
            </Text>
          </View>
          <Text style={styles.captionOverlay}>
            {language === 'hi' ? 'इस वीडियो को लाइक करें' : language === 'hi-en' ? 'Yeh video clip viral hogi!' : 'Turn long videos into viral clips'}
          </Text>
        </View>
      </View>

      {/* Tool Tabs Switcher */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tabItem, studioTab === 'timestamps' && { backgroundColor: theme.accent }]}
          onPress={() => setStudioTab('timestamps')}
        >
          <Text style={[styles.tabText, { color: studioTab === 'timestamps' ? '#FFF' : theme.textMuted }]}>
            Timestamps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, studioTab === 'crop' && { backgroundColor: theme.accent }]}
          onPress={() => setStudioTab('crop')}
        >
          <Text style={[styles.tabText, { color: studioTab === 'crop' ? '#FFF' : theme.textMuted }]}>
            Crop Framing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, studioTab === 'captions' && { backgroundColor: theme.accent }]}
          onPress={() => setStudioTab('captions')}
        >
          <Text style={[styles.tabText, { color: studioTab === 'captions' ? '#FFF' : theme.textMuted }]}>
            Captions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Timestamps & Stepper Controls */}
      {studioTab === 'timestamps' && (
        <View style={[styles.toolCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.toolTitle, { color: theme.text }]}>Add New Clip Segment</Text>

          <TextInput
            style={[styles.textInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Clip name (optional)"
            placeholderTextColor={theme.textMuted}
            value={clipName}
            onChangeText={setClipName}
          />

          <View style={styles.stepperSection}>
            <Text style={[styles.stepperLabel, { color: theme.textMuted }]}>
              Start: {formatHms(clipStartSec)} • Duration: {clipDuration}s • End: {formatHms(clipStartSec + clipDuration)}
            </Text>

            {/* Quick Duration Pills */}
            <View style={styles.pillRow}>
              {[15, 30, 45, 60].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  style={[
                    styles.pillBtn,
                    {
                      backgroundColor: clipDuration === sec ? theme.accent : theme.secondary,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setClipDuration(sec)}
                >
                  <Text style={[styles.pillText, { color: clipDuration === sec ? '#FFF' : theme.textMuted }]}>
                    {sec}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.accent, marginTop: 12 }]}
            onPress={handleAddClip}
          >
            <Text style={styles.primaryBtnText}>+ Add Clip to Timeline</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab 2: Crop Framing Controls */}
      {studioTab === 'crop' && (
        <View style={[styles.toolCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.toolTitle, { color: theme.text }]}>Crop Preset Modes</Text>
          <Text style={[styles.toolDesc, { color: theme.textMuted }]}>
            Select anchor framing for vertical 9:16 export:
          </Text>

          <View style={styles.pillRow}>
            {['left', 'center', 'right'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: selectedClip?.crop_setting?.preset_mode === mode ? theme.accent : theme.secondary,
                    borderColor: theme.border,
                  },
                ]}
                onPress={async () => {
                  if (selectedClip) {
                    await mobileApi.updateClip(selectedClip.id, {
                      crop_setting: { preset_mode: mode, aspect_ratio: '9:16' },
                    });
                    loadProject(project.id);
                  }
                }}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: selectedClip?.crop_setting?.preset_mode === mode ? '#FFF' : theme.textMuted,
                      textTransform: 'capitalize',
                    },
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Tab 3: Subtitle & Caption Styler */}
      {studioTab === 'captions' && (
        <View style={[styles.toolCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.toolTitle, { color: theme.text }]}>Speech Transcription & Style</Text>

          <View style={styles.pillRow}>
            {(['en', 'hi', 'hi-en'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: language === lang ? theme.accent : theme.secondary,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.pillText, { color: language === lang ? '#FFF' : theme.textMuted }]}>
                  {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Hinglish'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.accent, marginTop: 14 }]}
            onPress={handleTranscribe}
            disabled={transcribing}
          >
            <Text style={styles.primaryBtnText}>
              {transcribing ? 'Generating Speech Timestamps...' : 'Auto Transcribe Clip'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clips List */}
      <View style={styles.clipsListSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Clip Segments ({clips.length})</Text>

        {clips.map((clip, idx) => {
          const isSelected = clip.id === selectedClipId;
          return (
            <TouchableOpacity
              key={clip.id}
              style={[
                styles.clipItem,
                {
                  backgroundColor: theme.card,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
              ]}
              onPress={() => setSelectedClipId(clip.id)}
            >
              <View style={styles.clipItemTop}>
                <Text style={[styles.clipIndex, { color: theme.accent }]}>#{idx + 1}</Text>
                <Text style={[styles.clipName, { color: theme.text }]} numberOfLines={1}>
                  {clip.name}
                </Text>
                <Text style={[styles.clipDur, { color: theme.textMuted }]}>
                  {clip.duration}s
                </Text>
              </View>

              <View style={styles.clipActionsRow}>
                <Text style={[styles.clipTimeCode, { color: theme.textMuted }]}>
                  {clip.start_formatted} → {clip.end_formatted}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={() => handleDuplicate(clip.id)}>
                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '700' }}>Duplicate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(clip.id)}>
                    <Text style={{ color: theme.danger, fontSize: 11, fontWeight: '700' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  projTitle: { fontSize: 17, fontWeight: '800' },
  projMeta: { fontSize: 11, marginTop: 2 },
  exportAllBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  exportAllText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  viewportCard: { height: 220, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  phoneFrame: { width: 120, height: 200, borderRadius: 12, borderWidth: 2, borderColor: '#333', justifyContent: 'space-between', alignItems: 'center', padding: 8 },
  phoneIndicator: { color: '#888', fontSize: 8, fontWeight: '700' },
  faceTargetBox: { width: 60, height: 60, borderWidth: 1, borderColor: '#8B5CF6', borderStyle: 'dashed', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  faceTargetText: { color: '#8B5CF6', fontSize: 8, fontWeight: '800' },
  captionOverlay: { color: '#FFF', fontSize: 9, fontWeight: 'bold', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 3, borderRadius: 4 },
  tabBar: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, marginBottom: 14 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 12, fontWeight: '700' },
  toolCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  toolTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  toolDesc: { fontSize: 11, marginBottom: 10 },
  textInput: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 12, marginBottom: 10 },
  stepperSection: { marginTop: 4 },
  stepperLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 8 },
  pillBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: '700' },
  primaryBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  clipsListSection: { marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  clipItem: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  clipItemTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  clipIndex: { fontSize: 11, fontWeight: '800' },
  clipName: { fontSize: 13, fontWeight: '700', flex: 1 },
  clipDur: { fontSize: 11, fontWeight: '600' },
  clipActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clipTimeCode: { fontSize: 11, fontFamily: 'monospace' },
  emptyText: { fontSize: 13 },
});
