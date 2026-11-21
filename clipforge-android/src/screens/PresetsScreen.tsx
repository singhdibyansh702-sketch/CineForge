import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { ThemeColors } from '../constants/theme';
import { CaptionPreset } from '../types';
import { mobileApi } from '../services/api';

export const PresetsScreen: React.FC<{ theme: ThemeColors }> = ({ theme }) => {
  const [presets, setPresets] = useState<CaptionPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi.getPresets()
      .then(setPresets)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>Caption Styles</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Reusable subtitle typography and animated presets
      </Text>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 30 }} />
      ) : (
        presets.map((preset) => (
          <View key={preset.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.presetName, { color: theme.text }]}>{preset.name}</Text>
              <Text style={[styles.presetStyle, { color: theme.accent }]}>
                {preset.style_name.toUpperCase()}
              </Text>
            </View>

            <View style={[styles.previewCanvas, { backgroundColor: '#000' }]}>
              <Text style={{ color: preset.primary_color, fontSize: 14, fontWeight: '700' }}>
                Viral <Text style={{ color: preset.highlight_color }}>Reels</Text> Caption
              </Text>
            </View>

            <Text style={[styles.metaText, { color: theme.textMuted }]}>
              {preset.font_size}px Font • {preset.position} • {preset.animation_type} animation
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginBottom: 16, marginTop: 2 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  presetName: { fontSize: 14, fontWeight: '700' },
  presetStyle: { fontSize: 10, fontWeight: '800' },
  previewCanvas: { height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginVertical: 6 },
  metaText: { fontSize: 11, marginTop: 4 },
});
