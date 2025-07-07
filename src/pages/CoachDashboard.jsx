import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import GetStartedComponent from '../components/GetStartedComponent';

const { FiUsers, FiTarget, FiRepeat, FiLogOut, FiArrowRight, FiBookOpen, FiX } = FiIcons;

const CoachDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { users, assignments, goalAgreements, recurringAgreements, reports, recurringReports, themeSettings } = useData();
  const [showGetStarted, setShowGetStarted] = useState(false);

  const myParticipants = assignments
    .filter(a => a.coachId === user.id)
    .map(a => users.find(u => u.id === a.participantId))
    .filter(Boolean);

  const getParticipantStats = (participantId) => {
    const goals = goalAgreements.filter(g => g.participantId === participantId);
    const recurring = recurringAgreements.filter(r => r.participantId === participantId);

    const goalStats = {
      total: goals.length,
      notStarted: goals.filter(g => g.status === 'nog niet begonnen').length,
      inProgress: goals.filter(g => g.status === 'bezig').length,
      completed: goals.filter(g => g.status === 'klaar').length
    };

    // Count recurring reports for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const recurringStats = recurring.map(r => {
      const monthReports = recurringReports.filter(rep => 
        rep.recurringId === r.id && rep.month === currentMonth
      );
      const totalDays = monthReports.reduce((sum, rep) => sum + rep.completedDays.length, 0);
      return { ...r, completedDays: totalDays };
    });

    return { goalStats, recurringStats };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color-outer, #f3f4f6)' }}>
      {/* App Header */}
      {(themeSettings.logoUrl || themeSettings.appName !== 'Coaching App') && (
        <div style={{ backgroundColor: 'var(--bg-color-container, #ffffff)' }} className="py-2">
          <div 
            className={`mx-auto px-4 sm:px-6 lg:px-8 ${themeSettings.useMaxWidth ? 'max-w-7xl' : ''}`}
            style={themeSettings.useMaxWidth ? { maxWidth: themeSettings.containerMaxWidth } : {}}
          >
            <div className="flex items-center gap-4">
              {themeSettings.logoUrl && (
                <img 
                  src={themeSettings.logoUrl} 
                  alt="Logo" 
                  className="h-12 w-auto object-contain"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{themeSettings.appName}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ backgroundColor: 'var(--bg-color-container, #ffffff)' }} className="min-h-screen">
        <div 
          className={`mx-auto ${themeSettings.useMaxWidth ? 'max-w-7xl' : ''}`}
          style={themeSettings.useMaxWidth ? { maxWidth: themeSettings.containerMaxWidth } : {}}
        >
          {/* User Header */}
          <header style={{ backgroundColor: 'var(--header-bg-color, #ffffff)' }} className="shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Begeleider Dashboard</h1>
                  <p className="text-sm text-gray-600">Welkom, {user.voornaam}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowGetStarted(true)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiBookOpen} />
                    Aan de slag
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <SafeIcon icon={FiLogOut} />
                    Uitloggen
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overzicht</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                  <div className="flex items-center">
                    <SafeIcon icon={FiUsers} className="text-2xl text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Mijn deelnemers</p>
                      <p className="text-2xl font-bold text-gray-900">{myParticipants.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                  <div className="flex items-center">
                    <SafeIcon icon={FiTarget} className="text-2xl text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Totaal doelafspraken</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {goalAgreements.filter(g => 
                          myParticipants.some(p => p.id === g.participantId)
                        ).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                  <div className="flex items-center">
                    <SafeIcon icon={FiRepeat} className="text-2xl text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Herhalingsafspraken</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {recurringAgreements.filter(r => 
                          myParticipants.some(p => p.id === r.participantId)
                        ).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mijn deelnemers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myParticipants.map((participant) => {
                  const stats = getParticipantStats(participant.id);
                  return (
                    <motion.div
                      key={participant.id}
                      whileHover={{ scale: 1.02 }}
                      className="rounded-lg shadow hover:shadow-lg transition-all cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}
                      onClick={() => navigate(`/participant/${participant.id}`)}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {participant.voornaam} {participant.achternaam}
                            </h3>
                            <p className="text-sm text-gray-600">@{participant.nickname}</p>
                          </div>
                          <SafeIcon icon={FiArrowRight} className="text-gray-400" />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Doelafspraken</span>
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                {stats.goalStats.total} totaal
                              </span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {stats.goalStats.completed} klaar
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Herhalingsafspraken</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                              {stats.recurringStats.length} actief
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {myParticipants.length === 0 && (
                <div className="text-center py-12">
                  <SafeIcon icon={FiUsers} className="text-4xl text-gray-400 mb-4" />
                  <p className="text-gray-600">Je hebt nog geen deelnemers toegewezen gekregen.</p>
                  <p className="text-sm text-gray-500">Neem contact op met de administrator.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GetStarted Modal */}
      {showGetStarted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Aan de slag</h3>
              <button
                onClick={() => setShowGetStarted(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <GetStartedComponent />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard;