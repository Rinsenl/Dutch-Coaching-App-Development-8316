import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useEmailSender } from '../hooks/useEmailSender';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import GetStartedComponent from '../components/GetStartedComponent';

const { FiTarget, FiRepeat, FiLogOut, FiArrowRight, FiClock, FiCheckCircle, FiMail, FiUsers, FiMapPin, FiLink, FiCalendar, FiBookOpen, FiX } = FiIcons;

const ParticipantDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { goalAgreements, recurringAgreements, recurringReports, reports, meetings, themeSettings } = useData();
  const { sendOverviewEmail, isSending } = useEmailSender();
  const [showGetStarted, setShowGetStarted] = useState(false);

  const myGoals = goalAgreements.filter(g => g.participantId === user.id);
  const myRecurring = recurringAgreements.filter(r => r.participantId === user.id);
  const myMeetings = meetings.filter(m => m.participantId === user.id)
    .sort((a, b) => new Date(a.datum + ' ' + a.tijdstip) - new Date(b.datum + ' ' + b.tijdstip));

  const mainGoals = myGoals.filter(g => !g.parentId);
  const getSubgoals = (parentId) => myGoals.filter(g => g.parentId === parentId);

  const getRecurringStats = (recurringId) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = previousMonth.toISOString().slice(0, 7);

    const currentReports = recurringReports.find(r => r.recurringId === recurringId && r.month === currentMonth);
    const previousReports = recurringReports.find(r => r.recurringId === recurringId && r.month === prevMonthStr);

    const recurring = myRecurring.find(r => r.id === recurringId);
    const isResultMethod = recurring?.afspraakmethode === 'resultaat';

    if (isResultMethod) {
      const currentValues = currentReports?.values || {};
      const previousValues = previousReports?.values || {};

      const currentTotal = Object.values(currentValues).reduce((sum, val) => sum + val, 0);
      const currentCount = Object.values(currentValues).length;
      const currentAvg = currentCount > 0 ? (currentTotal / currentCount).toFixed(1) : '0.0';

      const previousTotal = Object.values(previousValues).reduce((sum, val) => sum + val, 0);
      const previousCount = Object.values(previousValues).length;
      const previousAvg = previousCount > 0 ? (previousTotal / previousCount).toFixed(1) : '0.0';

      return {
        currentMonth: `${currentTotal.toFixed(1)} totaal (⌀ ${currentAvg})`,
        previousMonth: `${previousTotal.toFixed(1)} totaal (⌀ ${previousAvg})`
      };
    } else {
      return {
        currentMonth: `${currentReports ? currentReports.completedDays.length : 0} dagen`,
        previousMonth: `${previousReports ? previousReports.completedDays.length : 0} dagen`
      };
    }
  };

  const goalStats = {
    total: mainGoals.length,
    notStarted: mainGoals.filter(g => g.status === 'nog niet begonnen').length,
    inProgress: mainGoals.filter(g => g.status === 'bezig').length,
    completed: mainGoals.filter(g => g.status === 'klaar').length
  };

  const getMeetingInfo = () => {
    const now = new Date();
    const sortedMeetings = [...myMeetings].sort((a, b) => {
      const dateTimeA = new Date(a.datum + ' ' + a.tijdstip);
      const dateTimeB = new Date(b.datum + ' ' + b.tijdstip);
      return dateTimeA - dateTimeB;
    });

    const pastMeetings = sortedMeetings.filter(m => {
      const meetingDateTime = new Date(m.datum + ' ' + m.tijdstip);
      return meetingDateTime < now;
    });

    const mostRecentMeeting = pastMeetings.length > 0 ? pastMeetings[pastMeetings.length - 1] : null;

    const futureMeetings = sortedMeetings.filter(m => {
      const meetingDateTime = new Date(m.datum + ' ' + m.tijdstip);
      return meetingDateTime > now;
    });

    const nextMeeting = futureMeetings.length > 0 ? futureMeetings[0] : null;

    return { mostRecentMeeting, nextMeeting };
  };

  const handleSendOverview = async () => {
    const participantName = `${user.voornaam} ${user.achternaam}`;
    const { mostRecentMeeting, nextMeeting } = getMeetingInfo();

    let emailBody = `Mijn Uitgebreide Coaching Overzicht\n\n`;

    // ONTMOETINGEN
    emailBody += `===ONTMOETINGEN===\n\n`;
    if (mostRecentMeeting) {
      emailBody += `Meest recente ontmoeting:\n`;
      emailBody += ` Datum: ${mostRecentMeeting.datum}\n`;
      emailBody += ` Tijd: ${mostRecentMeeting.tijdstip}\n`;
      emailBody += ` Type: ${mostRecentMeeting.type}\n`;
      if (mostRecentMeeting.type === 'fysiek' && mostRecentMeeting.adres) {
        emailBody += ` Locatie: ${mostRecentMeeting.adres}\n`;
      }
      if (mostRecentMeeting.type === 'virtueel' && mostRecentMeeting.link) {
        emailBody += ` Link: ${mostRecentMeeting.link}\n`;
      }
      emailBody += `\n`;
    }

    if (nextMeeting) {
      emailBody += `Eerstvolgende ontmoeting:\n`;
      emailBody += ` Datum: ${nextMeeting.datum}\n`;
      emailBody += ` Tijd: ${nextMeeting.tijdstip}\n`;
      emailBody += ` Type: ${nextMeeting.type}\n`;
      if (nextMeeting.type === 'fysiek' && nextMeeting.adres) {
        emailBody += ` Locatie: ${nextMeeting.adres}\n`;
      }
      if (nextMeeting.type === 'virtueel' && nextMeeting.link) {
        emailBody += ` Link: ${nextMeeting.link}\n`;
      }
      emailBody += `\n`;
    }

    if (!mostRecentMeeting && !nextMeeting) {
      emailBody += `Geen ontmoetingen gepland.\n\n`;
    }

    // DOELAFSPRAKEN
    emailBody += `===DOELAFSPRAKEN===\n\n`;
    mainGoals.forEach((goal, index) => {
      emailBody += `${index + 1}. HOOFDDOEL:\n`;
      emailBody += ` Omschrijving: ${goal.omschrijving}\n`;
      emailBody += ` Streefdatum: ${goal.streefdatum}\n`;
      emailBody += ` Rapportagefrequentie: ${goal.rapportagefrequentie}\n`;
      emailBody += ` Status: ${goal.status}\n`;

      // Subdoelen
      const subgoals = getSubgoals(goal.id);
      if (subgoals.length > 0) {
        emailBody += ` Subdoelen:\n`;
        subgoals.forEach((subgoal, subIndex) => {
          emailBody += ` ${index + 1}.${subIndex + 1} ${subgoal.omschrijving} (${subgoal.status}) - Streefdatum: ${subgoal.streefdatum}\n`;
        });
      }

      // Rapportages
      const goalReports = reports.filter(r => r.goalId === goal.id).sort((a, b) => new Date(b.datum) - new Date(a.datum));
      if (goalReports.length > 0) {
        emailBody += ` Mijn recente rapportages:\n`;
        goalReports.slice(0, 3).forEach(report => {
          emailBody += ` - ${report.datum}: ${report.tekst}\n`;
        });
      }

      emailBody += `\n`;
    });

    // HERHALINGSAFSPRAKEN
    emailBody += `===HERHALINGSAFSPRAKEN===\n\n`;
    myRecurring.forEach((recurring, index) => {
      const stats = getRecurringStats(recurring.id);
      emailBody += `${index + 1}. HERHALINGSAFSPRAAK:\n`;
      emailBody += ` Rubriek: ${recurring.rubriek}\n`;
      emailBody += ` Doel: ${recurring.afspraakdoel}\n`;
      emailBody += ` Actie: ${recurring.afspraakactie}\n`;
      emailBody += ` Notitie: ${recurring.afspraaknotitie}\n`;
      emailBody += ` Frequentie: ${recurring.afspraakfrequentie}\n`;
      emailBody += ` Methode: ${recurring.afspraakmethode || 'nee/ja'}\n`;
      emailBody += ` Deze maand: ${stats.currentMonth}\n`;
      emailBody += ` Vorige maand: ${stats.previousMonth}\n\n`;
    });

    emailBody += `Dit uitgebreide overzicht is automatisch gegenereerd door de ${themeSettings.appName || 'Coaching App'}.`;

    const emailData = {
      to: user.emailadres,
      subject: `Mijn Uitgebreide Coaching Overzicht - ${participantName}`,
      body: emailBody
    };

    await sendOverviewEmail(emailData, 'participant-overview');
  };

  const formatMeetingDateTime = (datum, tijdstip) => {
    return new Date(datum + ' ' + tijdstip).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' om ' + tijdstip;
  };

  const { mostRecentMeeting, nextMeeting } = getMeetingInfo();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color-outer,#f3f4f6)' }}>
      {/* App Header */}
      {(themeSettings.logoUrl || themeSettings.appName !== 'Coaching App') && (
        <div style={{ backgroundColor: 'var(--bg-color-container,#ffffff)' }} className="py-2">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${themeSettings.useMaxWidth ? 'max-w-7xl' : ''}`}
            style={themeSettings.useMaxWidth ? { maxWidth: themeSettings.containerMaxWidth } : {}}
          >
            <div className="flex items-center gap-4">
              {themeSettings.logoUrl && (
                <img src={themeSettings.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{themeSettings.appName}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ backgroundColor: 'var(--bg-color-container,#ffffff)' }} className="min-h-screen">
        <div className={`mx-auto ${themeSettings.useMaxWidth ? 'max-w-7xl' : ''}`}
          style={themeSettings.useMaxWidth ? { maxWidth: themeSettings.containerMaxWidth } : {}}
        >
          {/* User Header */}
          <header style={{ backgroundColor: 'var(--header-bg-color,#ffffff)' }} className="shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mijn Dashboard</h1>
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
            {/* Overzicht */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overzicht</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <SafeIcon icon={FiTarget} className="text-2xl text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Totaal doelen</p>
                      <p className="text-2xl font-bold text-gray-900">{goalStats.total}</p>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <SafeIcon icon={FiClock} className="text-2xl text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In uitvoering</p>
                      <p className="text-2xl font-bold text-gray-900">{goalStats.inProgress}</p>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <SafeIcon icon={FiCheckCircle} className="text-2xl text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Voltooid</p>
                      <p className="text-2xl font-bold text-gray-900">{goalStats.completed}</p>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <SafeIcon icon={FiRepeat} className="text-2xl text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Herhalingsafspraken</p>
                      <p className="text-2xl font-bold text-gray-900">{myRecurring.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ontmoetingen */}
            {(mostRecentMeeting || nextMeeting) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiUsers} className="text-teal-600" />
                  Ontmoetingen
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mostRecentMeeting && (
                    <div style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <SafeIcon icon={FiCalendar} className="text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Meest recente ontmoeting</h3>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <SafeIcon icon={FiClock} className="text-gray-400" />
                          <span>{formatMeetingDateTime(mostRecentMeeting.datum, mostRecentMeeting.tijdstip)}</span>
                        </div>
                        {mostRecentMeeting.type === 'fysiek' && mostRecentMeeting.adres && (
                          <div className="flex items-center gap-2">
                            <SafeIcon icon={FiMapPin} className="text-orange-600" />
                            <span>{mostRecentMeeting.adres}</span>
                          </div>
                        )}
                        {mostRecentMeeting.type === 'virtueel' && mostRecentMeeting.link && (
                          <div className="flex items-center gap-2">
                            <SafeIcon icon={FiLink} className="text-blue-600" />
                            <a
                              href={mostRecentMeeting.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate"
                            >
                              Meeting link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {nextMeeting && (
                    <div style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <SafeIcon icon={FiCalendar} className="text-green-600" />
                        <h3 className="font-semibold text-gray-900">Eerstvolgende ontmoeting</h3>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <SafeIcon icon={FiClock} className="text-gray-400" />
                          <span>{formatMeetingDateTime(nextMeeting.datum, nextMeeting.tijdstip)}</span>
                        </div>
                        {nextMeeting.type === 'fysiek' && nextMeeting.adres && (
                          <div className="flex items-center gap-2">
                            <SafeIcon icon={FiMapPin} className="text-orange-600" />
                            <span>{nextMeeting.adres}</span>
                          </div>
                        )}
                        {nextMeeting.type === 'virtueel' && nextMeeting.link && (
                          <div className="flex items-center gap-2">
                            <SafeIcon icon={FiLink} className="text-blue-600" />
                            <a
                              href={nextMeeting.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate"
                            >
                              Meeting link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Doelafspraken */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiTarget} className="text-blue-600" />
                  Mijn doelafspraken
                </h2>
                <div className="space-y-4">
                  {mainGoals.map((goal) => {
                    const subgoals = getSubgoals(goal.id);
                    return (
                      <motion.div
                        key={goal.id}
                        whileHover={{ scale: 1.02 }}
                        className="rounded-lg shadow hover:shadow-lg transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}
                        onClick={() => navigate(`/goal/${goal.id}`)}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{goal.omschrijving}</h3>
                              <p className="text-sm text-gray-600">Streefdatum: {goal.streefdatum}</p>
                              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                                goal.status === 'nog niet begonnen' ? 'bg-gray-100 text-gray-800' :
                                goal.status === 'bezig' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {goal.status}
                              </span>
                            </div>
                            <SafeIcon icon={FiArrowRight} className="text-gray-400" />
                          </div>

                          {subgoals.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm text-gray-600 mb-2">Subdoelen ({subgoals.length}):</p>
                              <div className="flex flex-wrap gap-2">
                                {subgoals.map(subgoal => (
                                  <span
                                    key={subgoal.id}
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      subgoal.status === 'nog niet begonnen' ? 'bg-gray-100 text-gray-700' :
                                      subgoal.status === 'bezig' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {subgoal.omschrijving}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {mainGoals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <SafeIcon icon={FiTarget} className="text-4xl text-gray-400 mb-4" />
                      <p>Je hebt nog geen doelafspraken</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Herhalingsafspraken */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SafeIcon icon={FiRepeat} className="text-purple-600" />
                  Mijn herhalingsafspraken
                </h2>
                <div className="space-y-4">
                  {myRecurring.map((recurring) => {
                    const stats = getRecurringStats(recurring.id);
                    return (
                      <motion.div
                        key={recurring.id}
                        whileHover={{ scale: 1.02 }}
                        className="rounded-lg shadow hover:shadow-lg transition-all cursor-pointer"
                        style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}
                        onClick={() => navigate(`/recurring/${recurring.id}`)}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{recurring.rubriek}</h3>
                              <p className="text-sm text-gray-600">{recurring.afspraakdoel}</p>
                              <p className="text-sm text-gray-500">{recurring.afspraakfrequentie}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Methode: {recurring.afspraakmethode || 'nee/ja'}
                              </p>
                            </div>
                            <SafeIcon icon={FiArrowRight} className="text-gray-400" />
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Deze maand:</span> {stats.currentMonth}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Vorige maand:</span> {stats.previousMonth}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {myRecurring.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <SafeIcon icon={FiRepeat} className="text-4xl text-gray-400 mb-4" />
                      <p>Je hebt nog geen herhalingsafspraken</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mail mijn overzicht button with loading state */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleSendOverview}
                disabled={isSending}
                className="flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--button-bg-color,#3B82F6)' }}
                onMouseEnter={(e) => !isSending && (e.target.style.backgroundColor = 'var(--button-hover-color,#2563EB)')}
                onMouseLeave={(e) => !isSending && (e.target.style.backgroundColor = 'var(--button-bg-color,#3B82F6)')}
              >
                <SafeIcon icon={FiMail} />
                {isSending ? 'Versturen...' : 'Mail mijn uitgebreide overzicht'}
              </button>
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

export default ParticipantDashboard;