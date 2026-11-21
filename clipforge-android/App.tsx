import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar
} from 'react-native';
import { darkTheme, lightTheme, ThemeColors } from './src/constants/theme';
import { ThemeMode } from './src/types';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { StudioScreen } from './src/screens/StudioScreen';
import { PresetsScreen } from './src/screens/PresetsScreen';
import { ExportsScreen } from './src/screens/ExportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const theme: ThemeColors = themeMode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const tabs = [
    { id: 'dashboard', label: 'Home' },
    { id: 'studio', label: 'Studio' },
    { id: 'projects', label: 'Projects' },
    { id: 'presets', label: 'Captions' },
    { id: 'exports', label: 'Exports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Screen Container */}
      <View style={styles.screenContainer}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            theme={theme}
            onOpenProject={(id) => setCurrentProjectId(id)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsScreen
            theme={theme}
            onOpenProject={(id) => setCurrentProjectId(id)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'studio' && (
          <StudioScreen
            theme={theme}
            projectId={currentProjectId}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'presets' && <PresetsScreen theme={theme} />}

        {activeTab === 'exports' && <ExportsScreen theme={theme} />}

        {activeTab === 'settings' && (
          <SettingsScreen
            theme={theme}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
          />
        )}
      </View>

      {/* Native Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.accent : theme.textMuted,
                    fontWeight: isActive ? '800' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && <View style={[styles.activeDot, { backgroundColor: theme.accent }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    height: 56,
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
