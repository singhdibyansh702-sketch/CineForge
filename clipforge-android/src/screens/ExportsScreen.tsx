import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { ThemeColors } from '../constants/theme';
import { mobileApi } from '../services/api';

export const ExportsScreen: React.FC<{ theme: ThemeColors }> = ({ theme }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileApi.getExportHistory()
      .then(setHistory)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (item: any) => {
    const fullUrl = `http://10.0.2.2:8000${item.download_url}`;
    Alert.alert(
      'Download MP4 Clip',
      `Ready to download ${item.filename} (${item.file_size_formatted})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => Linking.openURL(fullUrl).catch(() => {}) }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>Exported Clips</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Rendered 1080p / 4K MP4 clips ready to share on social media
      </Text>

      {loading ? (
        <ActivityIndicator color={theme.accent} style={{ marginTop: 30 }} />
      ) : history.length > 0 ? (
        history.map((file) => (
          <View key={file.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardInfo}>
              <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                {file.clip_name || file.filename}
              </Text>
              <Text style={[styles.meta, { color: theme.textMuted }]}>
                {file.resolution?.toUpperCase()} • {file.file_size_formatted} • {file.format?.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.dlBtn, { backgroundColor: theme.accent }]}
              onPress={() => handleDownload(file)}
            >
              <Text style={styles.dlBtnText}>Download</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No completed exports yet.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginBottom: 16, marginTop: 2 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1, marginRight: 10 },
  fileName: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 4 },
  dlBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  dlBtnText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  empty: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 12 },
});
