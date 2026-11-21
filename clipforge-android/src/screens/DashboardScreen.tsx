import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { ThemeColors } from '../constants/theme';
import { DashboardStats } from '../types';
import { mobileApi } from '../services/api';

interface DashboardScreenProps {
  theme: ThemeColors;
  onOpenProject: (projectId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  theme,
  onOpenProject,
  onNavigateTab
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await mobileApi.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.warn('Dashboard load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>ClipForge Mobile</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          AI Video Clipping & Caption Studio
        </Text>
      </View>

      {/* Metrics 2x2 Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>PROJECTS</Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>{stats?.total_projects ?? 0}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Active Workspaces</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>TOTAL CLIPS</Text>
          <Text style={[styles.metricValue, { color: theme.accent }]}>{stats?.total_clips ?? 0}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Multi-timestamps</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>PROCESSING</Text>
          <Text style={[styles.metricValue, { color: theme.warning }]}>{stats?.processing_clips ?? 0}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>FFmpeg Queue</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>EXPORTS</Text>
          <Text style={[styles.metricValue, { color: theme.success }]}>{stats?.completed_exports ?? 0}</Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>Completed MP4s</Text>
        </View>
      </View>

      {/* Quick Action Button */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.accent }]}
        onPress={() => onNavigateTab('projects')}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>+ Create New Project</Text>
      </TouchableOpacity>

      {/* Recent Projects List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Workspaces</Text>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
        ) : stats?.recent_projects && stats.recent_projects.length > 0 ? (
          stats.recent_projects.map((proj) => (
            <TouchableOpacity
              key={proj.id}
              style={[styles.projectCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                onOpenProject(proj.id);
                onNavigateTab('studio');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.projectHeader}>
                <Text style={[styles.projectTitle, { color: theme.text }]} numberOfLines={1}>
                  {proj.title}
                </Text>
                <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.badgeText, { color: theme.accent }]}>{proj.target_aspect_ratio}</Text>
                </View>
              </View>

              <Text style={[styles.projectDesc, { color: theme.textMuted }]} numberOfLines={2}>
                {proj.description || 'No description provided.'}
              </Text>

              <View style={styles.projectFooter}>
                <Text style={[styles.projectMeta, { color: theme.textMuted }]}>
                  {proj.clips_count} clips • {Math.round(proj.video_duration)}s duration
                </Text>
                <Text style={[styles.openAction, { color: theme.accent }]}>Open Studio →</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyBox, { borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No active projects found.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 10,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  projectCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  projectDesc: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#2A2A2A',
  },
  projectMeta: {
    fontSize: 11,
  },
  openAction: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
});
