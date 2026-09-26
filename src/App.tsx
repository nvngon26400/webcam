import React, { useState, useEffect } from 'react';
import { I18nProvider } from './context/I18nContext';
import { AuthProvider } from './context/AuthContext';
import { MeetingProvider, useMeeting } from './context/MeetingContext';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DevicePreview } from './components/lobby/DevicePreview';
import { MeetingRoom } from './components/meeting/MeetingRoom';
import { DocsModal } from './components/docs/DocsModal';

const AppContent: React.FC = () => {
  const { inMeeting, inLobby, enterLobby, activeMeeting } = useMeeting();
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin' | 'docs'>('landing');
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Check URL query parameters for direct invite link (e.g. ?room=aur-eng-sync)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !activeMeeting && !inMeeting && !inLobby) {
      // Auto-load room from parameter
      fetch(`/api/meetings/${roomParam}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            enterLobby(json.data);
          }
        })
        .catch(() => {});
    }
  }, []);

  // If in active meeting, display meeting room
  if (inMeeting) {
    return <MeetingRoom />;
  }

  // If in device preview lobby, display pre-call green room
  if (inLobby) {
    return <DevicePreview />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'docs') {
            setIsDocsOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
      />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onGetStarted={() => setCurrentView('dashboard')}
            onOpenDocs={() => setIsDocsOpen(true)}
          />
        )}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {isDocsOpen && <DocsModal onClose={() => setIsDocsOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <MeetingProvider>
          <AppContent />
        </MeetingProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
