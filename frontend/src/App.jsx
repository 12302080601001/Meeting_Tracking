import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import MeetingsPage from './pages/MeetingsPage';
import ActionItemsPage from './pages/ActionItemsPage';
import AuthPage from './pages/AuthPage';
import NewMeetingModal from './components/NewMeetingModal';
import { seedSampleData } from './api/client';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Theme State (Dark / Light mode)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSeedData = async () => {
    try {
      const res = await seedSampleData();
      showToast(res.message || 'Sample data loaded successfully!');
      window.location.reload();
    } catch (err) {
      showToast('Failed to seed sample data: ' + err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    showToast('Logged out successfully');
  };

  if (!token) {
    return <AuthPage onLoginSuccess={setToken} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-slate-100 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          {toastMessage}
        </div>
      )}

      {/* Main Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewMeeting={() => setIsNewMeetingOpen(true)}
        onSeedData={handleSeedData}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onOpenNewMeeting={() => setIsNewMeetingOpen(true)}
            onSeedData={handleSeedData}
            setSelectedMeetingId={setSelectedMeetingId}
          />
        )}

        {activeTab === 'meetings' && (
          <MeetingsPage
            selectedMeetingId={selectedMeetingId}
            setSelectedMeetingId={setSelectedMeetingId}
            onOpenNewMeeting={() => setIsNewMeetingOpen(true)}
          />
        )}

        {activeTab === 'action-items' && (
          <ActionItemsPage />
        )}
      </main>

      {/* New Meeting & Transcript AI Processing Modal */}
      <NewMeetingModal
        isOpen={isNewMeetingOpen}
        onClose={() => setIsNewMeetingOpen(false)}
        onSuccess={(newMeeting) => {
          showToast(`Successfully processed "${newMeeting.title}" with Gemini AI!`);
          setSelectedMeetingId(newMeeting.id);
          setActiveTab('meetings');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 bg-slate-950 text-center text-xs text-slate-500">
        AI Meeting Tracker • Built with Python FastAPI, SQLite, React.js, Vite & Google GenAI SDK (`google-genai` response_schema)
      </footer>

    </div>
  );
}
