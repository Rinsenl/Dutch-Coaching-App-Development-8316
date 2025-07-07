import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QuestProvider } from '@questlabs/react-sdk';
import '@questlabs/react-sdk/dist/style.css';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CoachDashboard from './pages/CoachDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import CoachParticipantDetail from './pages/CoachParticipantDetail';
import ParticipantGoalDetail from './pages/ParticipantGoalDetail';
import ParticipantRecurringDetail from './pages/ParticipantRecurringDetail';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { AdminProvider } from './context/AdminContext';
import ThemeProvider from './components/ThemeProvider';
import AppHelpHub from './components/HelpHub';
import FeedbackButton from './components/FeedbackButton';
import { questConfig } from './config/questConfig';
import './App.css';

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        {user?.role === 'admin' && (
          <Route path="/*" element={<AdminDashboard />} />
        )}
        {user?.role === 'manager' && (
          <Route path="/*" element={<ManagerDashboard />} />
        )}
        {user?.role === 'coach' && (
          <>
            <Route path="/" element={<CoachDashboard />} />
            <Route path="/dashboard" element={<CoachDashboard />} />
            <Route path="/participant/:id" element={<CoachParticipantDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
        {user?.role === 'participant' && (
          <>
            <Route path="/" element={<ParticipantDashboard />} />
            <Route path="/dashboard" element={<ParticipantDashboard />} />
            <Route path="/goal/:id" element={<ParticipantGoalDetail />} />
            <Route path="/recurring/:id" element={<ParticipantRecurringDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
      {/* Global Components - only show when authenticated */}
      <AppHelpHub />
      <FeedbackButton />
    </>
  );
}

function App() {
  return (
    <Router>
      <QuestProvider 
        apiKey={questConfig.APIKEY} 
        entityId={questConfig.ENTITYID} 
        apiType="PRODUCTION"
      >
        <AuthProvider>
          <DataProvider>
            <AdminProvider>
              <ThemeProvider>
                <div className="min-h-screen">
                  <AppRoutes />
                </div>
              </ThemeProvider>
            </AdminProvider>
          </DataProvider>
        </AuthProvider>
      </QuestProvider>
    </Router>
  );
}

export default App;