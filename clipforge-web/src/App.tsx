import React, { useState, useEffect } from 'react';
import { Sidebar, NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { NewProject } from './pages/NewProject';
import { MyProjects } from './pages/MyProjects';
import { ClippingStudio } from './pages/ClippingStudio';
import { CaptionPresets } from './pages/CaptionPresets';
import { ExportHistory } from './pages/ExportHistory';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './api/client';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | undefined>(undefined);

  // Auto-load demo project on first launch if none selected
  useEffect(() => {
    api.getProjects()
      .then((projects) => {
        if (projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projects[0].id);
          setProjectName(projects[0].title);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    api.getProject(projectId).then((p) => setProjectName(p.title)).catch(() => {});
  };

  return (
    <div className="min-h-screen flex bg-black dark:bg-[#000000] light:bg-[#F9FAFB] text-white dark:text-white light:text-zinc-900 transition-colors">
      {/* Sidebar Navigation (Desktop) */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
        selectedProjectId={selectedProjectId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          activeSection={activeSection}
          onNavigate={(sec) => setActiveSection(sec)}
          projectName={projectName}
        />

        <main className="flex-1 overflow-y-auto">
          {activeSection === 'dashboard' && (
            <Dashboard
              onNavigate={(sec) => setActiveSection(sec)}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeSection === 'new-project' && (
            <NewProject
              onNavigate={(sec) => setActiveSection(sec)}
              onProjectCreated={handleSelectProject}
            />
          )}

          {activeSection === 'my-projects' && (
            <MyProjects
              onNavigate={(sec) => setActiveSection(sec)}
              onSelectProject={handleSelectProject}
            />
          )}

          {activeSection === 'studio' && (
            <ClippingStudio
              projectId={selectedProjectId}
              onNavigateProjects={() => setActiveSection('my-projects')}
            />
          )}

          {activeSection === 'presets' && <CaptionPresets />}

          {activeSection === 'exports' && <ExportHistory />}

          {activeSection === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
      />
    </div>
  );
};
