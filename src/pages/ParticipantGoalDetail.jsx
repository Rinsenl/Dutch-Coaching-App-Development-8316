import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import SpeechRecognitionComponent from '../components/SpeechRecognitionComponent';

const { FiArrowLeft, FiSave, FiMessageSquare, FiX, FiMic } = FiIcons;

const ParticipantGoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { goalAgreements, setGoalAgreements, reports, setReports, notes, setNotes, themeSettings } = useData();
  const [newReport, setNewReport] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showSpeechRecognition, setShowSpeechRecognition] = useState(false);
  const [activeReportGoalId, setActiveReportGoalId] = useState(null);

  const goal = goalAgreements.find(g => g.id === id);
  const subgoals = goalAgreements.filter(g => g.parentId === id);
  const goalReports = reports.filter(r => r.goalId === id).sort((a, b) => new Date(b.datum) - new Date(a.datum));
  const goalNotes = notes.filter(n => n.goalId === id && n.userId === user.id && !n.isCoachNote).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!goal) {
    return <div>Doel niet gevonden</div>;
  }

  const handleStatusChange = async (newStatus) => {
    const updatedGoals = goalAgreements.map(g => 
      g.id === id ? { ...g, status: newStatus } : g
    );
    await setGoalAgreements(updatedGoals);
  };

  const handleSubgoalStatusChange = async (subgoalId, newStatus) => {
    const updatedGoals = goalAgreements.map(g => 
      g.id === subgoalId ? { ...g, status: newStatus } : g
    );
    await setGoalAgreements(updatedGoals);
  };

  const handleAddReport = async (goalId = id) => {
    if (!newReport.trim()) return;

    const report = {
      id: crypto.randomUUID(),
      goalId: goalId,
      participantId: user.id,
      tekst: newReport,
      datum: new Date().toISOString().split('T')[0]
    };

    await setReports([...reports, report]);
    setNewReport('');
    setActiveReportGoalId(null);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note = {
      id: crypto.randomUUID(),
      userId: user.id,
      goalId: id,
      text: newNote,
      timestamp: new Date().toISOString(),
      isCoachNote: false
    };

    await setNotes([...notes, note]);
    setNewNote('');
    setShowNoteForm(false);
  };

  const handleSpeechResult = (transcript) => {
    setNewReport(transcript);
    setShowSpeechRecognition(false);
  };

  const getSubgoalReports = (subgoalId) => {
    return reports.filter(r => r.goalId === subgoalId).sort((a, b) => new Date(b.datum) - new Date(a.datum));
  };

  const getSubgoalNotes = (subgoalId) => {
    return notes.filter(n => n.goalId === subgoalId && n.userId === user.id && !n.isCoachNote).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
          <header style={{ backgroundColor: 'var(--header-bg-color, #ffffff)' }} className="shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-6"
                >
                  <SafeIcon icon={FiArrowLeft} />
                  Terug naar dashboard
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{goal.omschrijving}</h1>
                  <p className="text-sm text-gray-600">Streefdatum: {goal.streefdatum}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Hoofddoel */}
              <div className="space-y-6">
                <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Hoofddoel</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={goal.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                      >
                        <option value="nog niet begonnen">Nog niet begonnen</option>
                        <option value="bezig">Bezig</option>
                        <option value="klaar">Klaar</option>
                      </select>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Rapportagefrequentie:</span> {goal.rapportagefrequentie}
                      </p>
                    </div>

                    {/* Consequentie weergave voor deelnemer */}
                    {goal.consequentieVanToepassing === 'ja' && goal.consequentie && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Consequentie:</span> {goal.consequentie}
                        </p>
                      </div>
                    )}

                    {goal.status === 'bezig' && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Nieuwe rapportage
                          </label>
                          <button
                            onClick={() => setShowSpeechRecognition(true)}
                            className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            title="Spraak naar tekst"
                          >
                            <SafeIcon icon={FiMic} />
                            Dicteren
                          </button>
                        </div>
                        <textarea
                          value={newReport}
                          onChange={(e) => setNewReport(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                          rows="3"
                          placeholder="Beschrijf je voortgang..."
                        />
                        <button
                          onClick={() => handleAddReport()}
                          className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <SafeIcon icon={FiSave} />
                          Rapportage opslaan
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-700">Notities</h3>
                        <button
                          onClick={() => setShowNoteForm(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <SafeIcon icon={FiMessageSquare} className="inline mr-1" />
                          Notitie toevoegen
                        </button>
                      </div>
                      {goalNotes.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {goalNotes.map(note => (
                            <div key={note.id} className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-800">{note.text}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(note.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Nog geen notities toegevoegd</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subdoelen */}
                {subgoals.length > 0 && (
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Subdoelen</h2>
                    <div className="space-y-4">
                      {subgoals.map(subgoal => {
                        const subgoalReports = getSubgoalReports(subgoal.id);
                        const subgoalNotes = getSubgoalNotes(subgoal.id);
                        
                        return (
                          <div key={subgoal.id} className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">{subgoal.omschrijving}</h3>
                            <p className="text-sm text-gray-600 mb-3">Streefdatum: {subgoal.streefdatum}</p>
                            
                            {/* Consequentie weergave voor subdoel */}
                            {subgoal.consequentieVanToepassing === 'ja' && subgoal.consequentie && (
                              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                <span className="font-medium">Consequentie:</span> {subgoal.consequentie}
                              </div>
                            )}

                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                              </label>
                              <select
                                value={subgoal.status}
                                onChange={(e) => handleSubgoalStatusChange(subgoal.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                              >
                                <option value="nog niet begonnen">Nog niet begonnen</option>
                                <option value="bezig">Bezig</option>
                                <option value="klaar">Klaar</option>
                              </select>
                            </div>

                            {/* Rapportage voor subdoel */}
                            {subgoal.status === 'bezig' && (
                              <div className="mb-3">
                                {activeReportGoalId === subgoal.id ? (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Rapportage voor subdoel
                                    </label>
                                    <textarea
                                      value={newReport}
                                      onChange={(e) => setNewReport(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                                      rows="2"
                                      placeholder="Beschrijf je voortgang op dit subdoel..."
                                    />
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => handleAddReport(subgoal.id)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                      >
                                        Opslaan
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveReportGoalId(null);
                                          setNewReport('');
                                        }}
                                        className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                                      >
                                        Annuleren
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setActiveReportGoalId(subgoal.id)}
                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                  >
                                    + Rapportage toevoegen
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Toon rapportages van subdoel */}
                            {subgoalReports.length > 0 && (
                              <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
                                <h4 className="font-medium text-gray-900 mb-1">Mijn rapportages:</h4>
                                <div className="space-y-1">
                                  {subgoalReports.slice(0, 2).map(report => (
                                    <div key={report.id}>
                                      <span className="font-medium">{report.datum}:</span> {report.tekst}
                                    </div>
                                  ))}
                                  {subgoalReports.length > 2 && (
                                    <p className="text-gray-500">... en {subgoalReports.length - 2} meer</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Toon notities van subdoel */}
                            {subgoalNotes.length > 0 && (
                              <div className="p-2 bg-blue-50 rounded text-sm">
                                <h4 className="font-medium text-gray-900 mb-1">Mijn notities:</h4>
                                <div className="space-y-1">
                                  {subgoalNotes.slice(0, 2).map(note => (
                                    <div key={note.id}>
                                      <span className="font-medium">{new Date(note.timestamp).toLocaleDateString()}:</span> {note.text}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rapportages */}
              <div className="space-y-6">
                <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Mijn rapportages</h2>
                  {goalReports.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {goalReports.map(report => (
                        <div key={report.id} className="border-l-4 border-blue-500 pl-4 py-2">
                          <p className="text-sm text-gray-800">{report.tekst}</p>
                          <p className="text-xs text-gray-500 mt-1">{report.datum}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nog geen rapportages toegevoegd</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Speech Recognition Modal */}
      {showSpeechRecognition && (
        <SpeechRecognitionComponent
          onResult={handleSpeechResult}
          onClose={() => setShowSpeechRecognition(false)}
        />
      )}

      {/* Note Form Modal */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg shadow-xl p-6 w-full max-w-md"
            style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notitie toevoegen</h3>
              <button
                onClick={() => setShowNoteForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notitie
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                  rows="4"
                  placeholder="Typ je notitie hier..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNoteForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddNote}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiSave} />
                Opslaan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ParticipantGoalDetail;