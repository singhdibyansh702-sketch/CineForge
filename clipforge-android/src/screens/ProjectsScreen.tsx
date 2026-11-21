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
import { Project } from '../types';
import { mobileApi } from '../services/api';

interface ProjectsScreenProps {
  theme: ThemeColors;
  onOpenProject: (projectId: string) => void;
  onNavigateTab: (tab: string) => void;
}

interface MobileTimeline {
  id: string;
  name: string;
  startHms: string; // HH:MM:SS
  duration: number; // in seconds
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  theme,
  onOpenProject,
  onNavigateTab
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Project Form Modal/Inline
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  
  // Mandatory Multiple Timelines
  const [timelines, setTimelines] = useState<MobileTimeline[]>([
    { id: '1', name: 'Clip 01', startHms: '00:00:00', duration: 30 },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await mobileApi.getProjects();
      setProjects(data);
    } catch (e) {
      console.warn('Projects load error', e);
    } finally {
      setLoading(false);
    }
  };

  const parseHms = (hms: string): number => {
    const parts = hms.trim().split(':').map((p) => parseFloat(p) || 0);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const handleAddTimeline = () => {
    const last = timelines[timelines.length - 1];
    let nextStartSec = 0;
    if (last) {
      nextStartSec = parseHms(last.startHms) + last.duration;
    }
    const h = Math.floor(nextStartSec / 3600);
    const m = Math.floor((nextStartSec % 3600) / 60);
    const s = Math.floor(nextStartSec % 60);
    const nextStartHms = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    const nextIdx = timelines.length + 1;

    setTimelines([
      ...timelines,
      {
        id: String(Date.now()),
        name: `Clip ${nextIdx.toString().padStart(2, '0')}`,
        startHms: nextStartHms,
        duration: 30,
      },
    ]);
  };

  const handleRemoveTimeline = (index: number) => {
    if (timelines.length <= 1) {
      Alert.alert('Required', 'At least one timestamp timeline is mandatory.');
      return;
    }
    setTimelines(timelines.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please enter a project title');
      return;
    }

    // Mandatory Timestamps Validation
    for (let i = 0; i < timelines.length; i++) {
      const t = timelines[i];
      if (!t.startHms.trim()) {
        Alert.alert('Required', `Timeline #${i + 1}: Start timestamp (HH:MM:SS) is mandatory.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const proj = await mobileApi.createProject(newTitle.trim(), aspectRatio);

      // Create each timeline clip
      for (const t of timelines) {
        await mobileApi.createClip({
          project_id: proj.id,
          name: t.name || 'Clip',
          start_time: parseHms(t.startHms),
          duration: t.duration,
          language: 'en',
        });
      }

      setIsCreating(false);
      setNewTitle('');
      onOpenProject(proj.id);
      onNavigateTab('studio');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Video Projects</Text>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: theme.accent }]}
          onPress={() => setIsCreating(!isCreating)}
        >
          <Text style={styles.newBtnText}>{isCreating ? 'Close' : '+ New'}</Text>
        </TouchableOpacity>
      </View>

      {/* Inline Create Form */}
      {isCreating && (
        <View style={[styles.createCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.createTitle, { color: theme.text }]}>Create Mobile Project</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
            placeholder="Project title (e.g. Podcast Shorts)"
            placeholderTextColor={theme.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
          />

          <View style={styles.aspectRow}>
            {['9:16', '1:1', '16:9'].map((ratio) => (
              <TouchableOpacity
                key={ratio}
                style={[
                  styles.aspectBtn,
                  {
                    backgroundColor: aspectRatio === ratio ? theme.accent : theme.secondary,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setAspectRatio(ratio)}
              >
                <Text
                  style={[
                    styles.aspectText,
                    { color: aspectRatio === ratio ? '#FFFFFF' : theme.textMuted },
                  ]}
                >
                  {ratio}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mandatory Timelines on Mobile */}
          <View style={styles.timelinesSection}>
            <View style={styles.timelinesHeader}>
              <Text style={[styles.timelinesTitle, { color: theme.text }]}>
                TIMESTAMPS * (MANDATORY)
              </Text>
              <TouchableOpacity
                style={[styles.addTimeBtn, { backgroundColor: theme.accent }]}
                onPress={handleAddTimeline}
              >
                <Text style={styles.addTimeBtnText}>+ Add Timeline</Text>
              </TouchableOpacity>
            </View>

            {timelines.map((tl, idx) => (
              <View
                key={tl.id}
                style={[styles.timelineRowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.timelineRowTop}>
                  <Text style={[styles.timelineRowLabel, { color: theme.accent }]}>#{idx + 1}</Text>
                  <TextInput
                    style={[styles.clipNameInput, { color: theme.text, borderColor: theme.border }]}
                    value={tl.name}
                    onChangeText={(val) => {
                      const updated = [...timelines];
                      updated[idx].name = val;
                      setTimelines(updated);
                    }}
                    placeholder="Clip Name"
                    placeholderTextColor={theme.textMuted}
                  />
                  {timelines.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveTimeline(idx)}>
                      <Text style={{ color: theme.danger, fontSize: 11, fontWeight: '700' }}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.timeInputsRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.inputSubLabel, { color: theme.textMuted }]}>Start (HH:MM:SS) *</Text>
                    <TextInput
                      style={[styles.hmsInput, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
                      value={tl.startHms}
                      placeholder="00:02:15"
                      placeholderTextColor={theme.textMuted}
                      onChangeText={(val) => {
                        const updated = [...timelines];
                        updated[idx].startHms = val;
                        setTimelines(updated);
                      }}
                    />
                  </View>

                  <View style={{ width: 90 }}>
                    <Text style={[styles.inputSubLabel, { color: theme.textMuted }]}>Duration (Sec)</Text>
                    <TextInput
                      style={[styles.hmsInput, { backgroundColor: theme.secondary, color: theme.text, borderColor: theme.border }]}
                      value={String(tl.duration)}
                      keyboardType="numeric"
                      onChangeText={(val) => {
                        const updated = [...timelines];
                        updated[idx].duration = parseInt(val) || 30;
                        setTimelines(updated);
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.accent, marginTop: 14 }]}
            onPress={handleCreate}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Creating Project & Timelines...' : `Launch with ${timelines.length} Timelines`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Projects List */}
      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 30 }} />
      ) : projects.length > 0 ? (
        projects.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              onOpenProject(item.id);
              onNavigateTab('studio');
            }}
          >
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.badgeText, { color: theme.accent }]}>{item.target_aspect_ratio}</Text>
              </View>
            </View>

            <Text style={[styles.itemMeta, { color: theme.textMuted }]}>
              {item.clips_count ?? 0} clips configured • Ready for export
            </Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No projects created yet.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  newBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  createCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  createTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  input: { height: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, marginBottom: 12 },
  aspectRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  aspectBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  aspectText: { fontSize: 12, fontWeight: '700' },
  timelinesSection: { marginTop: 6, marginBottom: 6 },
  timelinesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timelinesTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  addTimeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  addTimeBtnText: { color: '#FFF', fontWeight: '700', fontSize: 10 },
  timelineRowCard: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  timelineRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  timelineRowLabel: { fontSize: 11, fontWeight: '800', marginRight: 6 },
  clipNameInput: { flex: 1, height: 32, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, fontSize: 11, marginRight: 8 },
  timeInputsRow: { flexDirection: 'row', alignItems: 'center' },
  inputSubLabel: { fontSize: 9, fontWeight: '600', marginBottom: 2 },
  hmsInput: { height: 34, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, fontSize: 12, fontFamily: 'monospace' },
  submitBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  itemCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  itemMeta: { fontSize: 11, marginTop: 4 },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 12 },
});
