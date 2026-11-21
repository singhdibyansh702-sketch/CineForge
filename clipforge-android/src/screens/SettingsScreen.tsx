import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemeColors, darkTheme, lightTheme } from '../constants/theme';
import { ThemeMode } from '../types';

interface SettingsScreenProps {
  theme: ThemeColors;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  theme,
  themeMode,
  onToggleTheme
}) => {
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        Theme preferences and engine configurations
      </Text>

      {/* Theme Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>THEME SYSTEM</Text>
        <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
          Current theme: {themeMode === 'dark' ? 'Pure Black Dark Mode (#000000)' : 'Warm White Light Mode'}
        </Text>

        <TouchableOpacity
          style={[styles.toggleBtn, { backgroundColor: theme.secondary, borderColor: theme.border }]}
          onPress={onToggleTheme}
        >
          <Text style={[styles.toggleBtnText, { color: theme.accent }]}>
            Switch to {themeMode === 'dark' ? 'Light Mode' : 'Dark Mode (Pure Black)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Engine Status Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>BACKEND VIDEO PIPELINE</Text>
        <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
          FFmpeg 7.x Native Engine • Multilingual Whisper Subtitles • H.264 / AAC Encoding
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginBottom: 16, marginTop: 2 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  cardTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  cardDesc: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  toggleBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  toggleBtnText: { fontSize: 13, fontWeight: '700' },
});
