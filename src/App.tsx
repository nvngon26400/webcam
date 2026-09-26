import React, { useState, useEffect } from 'react';
import { I18nProvider } from './context/I18nContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MeetingProvider, useMeeting } from './context/MeetingContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { DevicePreview } from './components/lobby/DevicePreview';
import { MeetingRoom } from './components/meeting/MeetingRoom';
import { DocsModal } from './components/docs/DocsModal';

const AppContent: React.FC = () => {
  const { inMeeting, inLobby, enterLobby, leaveMeeting, activeMeeting } = useMeeting();
  const { isAuthenticated, isAdmin } = useAuth();
  const toast = useToast();

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'admin' | 'docs'>('landing');
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Check URL query parameters for direct invite link (e.g. ?room=aur-eng-sync)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !activeMeeting && !inMeeting && !inLobby) {
      if (!isAuthenticated) {
        toast.authRequired(
          'Vui lòng đăng nhập hoặc tạo tài khoản để tham gia cuộc họp bằng đường liên kết mời.',
        );
        return;
      }

      // Auto-load room from parameter if authenticated
      fetch(`/api/meetings/${roomParam}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            enterLobby(json.data);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Unauthenticated guard: If user somehow got into lobby or meeting while not authenticated, eject to landing
  useEffect(() => {
    if (!isAuthenticated && (inMeeting || inLobby)) {
      leaveMeeting();
      setCurrentView('landing');
      toast.authRequired('Vui lòng đăng nhập để tham gia hoặc tạo cuộc họp.');
    }
    if (!isAuthenticated && (currentView === 'dashboard' || currentView === 'admin')) {
      setCurrentView('landing');
    }
  }, [isAuthenticated, inMeeting, inLobby, currentView]);

  // If in active meeting and authenticated, display meeting room
  if (inMeeting && isAuthenticated) {
    return <MeetingRoom />;
  }

  // If in device preview lobby and authenticated, display pre-call green room
  if (inLobby && isAuthenticated) {
    return <DevicePreview />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
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
            onGetStarted={() => {
              if (!isAuthenticated) {
                toast.authRequired('Vui lòng đăng nhập để mở Bảng điều khiển cuộc họp.');
                return;
              }
              setCurrentView('dashboard');
            }}
            onOpenDocs={() => setIsDocsOpen(true)}
          />
        )}
        {currentView === 'dashboard' && isAuthenticated && <Dashboard />}
        {currentView === 'admin' && isAuthenticated && isAdmin && <AdminDashboard />}
      </main>

      {isDocsOpen && <DocsModal onClose={() => setIsDocsOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <I18nProvider>
          <AuthProvider>
            <MeetingProvider>
              <AppContent />
            </MeetingProvider>
          </AuthProvider>
        </I18nProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
