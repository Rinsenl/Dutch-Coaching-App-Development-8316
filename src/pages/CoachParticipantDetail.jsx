import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useEmailSender } from '../hooks/useEmailSender';
import supabase from '../lib/supabase'; // DIRECT IMPORT FOR DEBUGGING
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiTarget, FiRepeat, FiPlus, FiEdit2, FiSave, FiX, FiEye, FiEyeOff, FiMessageSquare, FiTrash2, FiMail, FiCalendar, FiUsers, FiMapPin, FiLink, FiClock } = FiIcons;

const CoachParticipantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, goalAgreements, setGoalAgreements, recurringAgreements, setRecurringAgreements, reports, notes, setNotes, recurringReports, meetings, setMeetings, themeSettings } = useData();
  const { sendOverviewEmail, isSending } = useEmailSender();

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [visibleReports, setVisibleReports] = useState({});
  const [newNote, setNewNote] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(null);
  const [showRecurringModal, setShowRecurringModal] = useState(null);

  const [goalForm, setGoalForm] = useState({
    omschrijving: '',
    streefdatum: '',
    rapportagefrequentie: 'wekelijks',
    isSubgoal: false,
    parentId: null,
    consequentieVanToepassing: 'nee',
    consequentie: ''
  });

  const [recurringForm, setRecurringForm] = useState({
    rubriek: '',
    afspraakdoel: '',
    afspraakactie: '',
    afspraaknotitie: '',
    afspraakfrequentie: '',
    afspraakmethode: 'nee/ja',
    consequentieVanToepassing: 'nee',
    consequentie: ''
  });

  const [meetingForm, setMeetingForm] = useState({
    datum: '',
    tijdstip: '',
    type: 'fysiek',
    adres: '',
    link: '',
    plan: '',
    verslag: ''
  });

  const participant = users.find(u => u.id === id);
  const participantGoals = goalAgreements.filter(g => g.participantId === id);
  const participantRecurring = recurringAgreements.filter(r => r.participantId === id);
  const participantMeetings = meetings.filter(m => m.participantId === id).sort((a, b) => 
    new Date(a.datum + ' ' + a.tijdstip) - new Date(b.datum + ' ' + b.tijdstip)
  );

  if (!participant) {
    return <div>Deelnemer niet gevonden</div>;
  }

  // DEBUGGING FUNCTIONS
  const debugDatabaseOperation = async (operation, data) => {
    console.log(`🔍 DEBUG: Starting ${operation}`);
    console.log('🔍 DEBUG: Data to save:', data);
    console.log('🔍 DEBUG: User:', user);
    console.log('🔍 DEBUG: Organization ID:', user?.organizationId);
  };

  // DIRECT DATABASE SAVE FUNCTIONS (BYPASS CONTEXT)
  const saveGoalDirectly = async (goalData) => {
    try {
      await debugDatabaseOperation('SAVE GOAL DIRECTLY', goalData);
      
      const supabaseGoal = {
        id: goalData.id || crypto.randomUUID(),
        participant_id: id,
        coach_id: user.id,
        parent_id: goalData.parentId || null,
        omschrijving: goalData.omschrijving,
        streefdatum: goalData.streefdatum,
        rapportagefrequentie: goalData.rapportagefrequentie,
        status: goalData.status || 'nog niet begonnen',
        consequentie_van_toepassing: goalData.consequentieVanToepassing || 'nee',
        consequentie: goalData.consequentie || null,
        organization_id: user?.organizationId || null
      };

      console.log('🔍 DEBUG: Supabase goal object:', supabaseGoal);

      const { data, error } = await supabase
        .from('goal_agreements_coaching')
        .insert([supabaseGoal])
        .select();

      console.log('🔍 DEBUG: Supabase response:', { data, error });

      if (error) {
        console.error('❌ DIRECT GOAL SAVE ERROR:', error);
        alert(`Database error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`);
        return false;
      }

      if (data && data.length > 0) {
        console.log('✅ DIRECT GOAL SAVE SUCCESS:', data[0]);
        alert('✅ Doel succesvol opgeslagen in database!');
        
        // Update context state
        const newGoal = {
          id: data[0].id,
          participantId: data[0].participant_id,
          coachId: data[0].coach_id,
          parentId: data[0].parent_id,
          omschrijving: data[0].omschrijving,
          streefdatum: data[0].streefdatum,
          rapportagefrequentie: data[0].rapportagefrequentie,
          status: data[0].status,
          consequentieVanToepassing: data[0].consequentie_van_toepassing,
          consequentie: data[0].consequentie,
          organizationId: data[0].organization_id
        };
        
        await setGoalAgreements([...goalAgreements, newGoal]);
        return true;
      }

      console.error('❌ No data returned from insert');
      alert('❌ Geen data teruggegeven van database');
      return false;
    } catch (error) {
      console.error('❌ DIRECT GOAL SAVE EXCEPTION:', error);
      alert(`Exception: ${error.message}`);
      return false;
    }
  };

  const saveRecurringDirectly = async (recurringData) => {
    try {
      await debugDatabaseOperation('SAVE RECURRING DIRECTLY', recurringData);
      
      const supabaseRecurring = {
        id: recurringData.id || crypto.randomUUID(),
        participant_id: id,
        coach_id: user.id,
        rubriek: recurringData.rubriek,
        afspraakdoel: recurringData.afspraakdoel,
        afspraakactie: recurringData.afspraakactie || null,
        afspraaknotitie: recurringData.afspraaknotitie || null,
        afspraakfrequentie: recurringData.afspraakfrequentie || null,
        afspraakmethode: recurringData.afspraakmethode || 'nee/ja',
        consequentie_van_toepassing: recurringData.consequentieVanToepassing || 'nee',
        consequentie: recurringData.consequentie || null,
        organization_id: user?.organizationId || null
      };

      console.log('🔍 DEBUG: Supabase recurring object:', supabaseRecurring);

      const { data, error } = await supabase
        .from('recurring_agreements_coaching')
        .insert([supabaseRecurring])
        .select();

      console.log('🔍 DEBUG: Supabase response:', { data, error });

      if (error) {
        console.error('❌ DIRECT RECURRING SAVE ERROR:', error);
        alert(`Database error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`);
        return false;
      }

      if (data && data.length > 0) {
        console.log('✅ DIRECT RECURRING SAVE SUCCESS:', data[0]);
        alert('✅ Herhalingsafspraak succesvol opgeslagen in database!');
        
        // Update context state
        const newRecurring = {
          id: data[0].id,
          participantId: data[0].participant_id,
          coachId: data[0].coach_id,
          rubriek: data[0].rubriek,
          afspraakdoel: data[0].afspraakdoel,
          afspraakactie: data[0].afspraakactie,
          afspraaknotitie: data[0].afspraaknotitie,
          afspraakfrequentie: data[0].afspraakfrequentie,
          afspraakmethode: data[0].afspraakmethode,
          consequentieVanToepassing: data[0].consequentie_van_toepassing,
          consequentie: data[0].consequentie,
          organizationId: data[0].organization_id
        };
        
        await setRecurringAgreements([...recurringAgreements, newRecurring]);
        return true;
      }

      console.error('❌ No data returned from insert');
      alert('❌ Geen data teruggegeven van database');
      return false;
    } catch (error) {
      console.error('❌ DIRECT RECURRING SAVE EXCEPTION:', error);
      alert(`Exception: ${error.message}`);
      return false;
    }
  };

  // GOAL MANAGEMENT FUNCTIONS
  const handleAddGoal = (parentId = null) => {
    setEditingGoal(null);
    setGoalForm({
      omschrijving: '',
      streefdatum: '',
      rapportagefrequentie: 'wekelijks',
      isSubgoal: !!parentId,
      parentId,
      consequentieVanToepassing: 'nee',
      consequentie: ''
    });
    setShowGoalForm(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      omschrijving: goal.omschrijving,
      streefdatum: goal.streefdatum,
      rapportagefrequentie: goal.rapportagefrequentie,
      isSubgoal: !!goal.parentId,
      parentId: goal.parentId,
      consequentieVanToepassing: goal.consequentieVanToepassing || 'nee',
      consequentie: goal.consequentie || ''
    });
    setShowGoalForm(true);
  };

  const handleDeleteGoal = (goal) => {
    const isMainGoal = !goal.parentId;
    const subgoals = isMainGoal ? participantGoals.filter(g => g.parentId === goal.id) : [];
    
    let confirmMessage = `Weet je zeker dat je ${isMainGoal ? 'dit doel' : 'dit subdoel'} wilt verwijderen?`;
    if (isMainGoal && subgoals.length > 0) {
      confirmMessage += ` Dit zal ook ${subgoals.length} subdoel(en) verwijderen.`;
    }

    if (window.confirm(confirmMessage)) {
      if (isMainGoal) {
        setGoalAgreements(goalAgreements.filter(g => g.id !== goal.id && g.parentId !== goal.id));
      } else {
        setGoalAgreements(goalAgreements.filter(g => g.id !== goal.id));
      }
    }
  };

  const handleSaveGoal = async () => {
    if (!goalForm.omschrijving || !goalForm.streefdatum) {
      alert('Omschrijving en streefdatum zijn verplicht');
      return;
    }

    if (goalForm.consequentieVanToepassing === 'ja' && !goalForm.consequentie.trim()) {
      alert('Consequentie is verplicht wanneer consequentie van toepassing is');
      return;
    }

    console.log('🚀 STARTING GOAL SAVE PROCESS');
    console.log('🚀 Goal form data:', goalForm);
    console.log('🚀 Editing goal:', editingGoal);

    if (editingGoal) {
      // Update existing goal
      setGoalAgreements(goalAgreements.map(g => 
        g.id === editingGoal.id 
          ? { ...g, ...goalForm }
          : g
      ));
      alert('Doel bijgewerkt!');
    } else {
      // Create new goal - USE DIRECT SAVE
      const success = await saveGoalDirectly(goalForm);
      if (!success) {
        console.error('❌ Goal save failed');
        return;
      }
    }

    setShowGoalForm(false);
  };

  // RECURRING MANAGEMENT FUNCTIONS
  const handleAddRecurring = () => {
    setEditingRecurring(null);
    setRecurringForm({
      rubriek: '',
      afspraakdoel: '',
      afspraakactie: '',
      afspraaknotitie: '',
      afspraakfrequentie: '',
      afspraakmethode: 'nee/ja',
      consequentieVanToepassing: 'nee',
      consequentie: ''
    });
    setShowRecurringForm(true);
  };

  const handleEditRecurring = (recurring) => {
    setEditingRecurring(recurring);
    setRecurringForm({
      ...recurring,
      consequentieVanToepassing: recurring.consequentieVanToepassing || 'nee',
      consequentie: recurring.consequentie || ''
    });
    setShowRecurringForm(true);
  };

  const handleDeleteRecurring = (recurring) => {
    if (window.confirm('Weet je zeker dat je deze herhalingsafspraak wilt verwijderen?')) {
      setRecurringAgreements(recurringAgreements.filter(r => r.id !== recurring.id));
    }
  };

  const handleSaveRecurring = async () => {
    if (!recurringForm.rubriek || !recurringForm.afspraakdoel) {
      alert('Rubriek en afspraakdoel zijn verplicht');
      return;
    }

    if (recurringForm.consequentieVanToepassing === 'ja' && !recurringForm.consequentie.trim()) {
      alert('Consequentie is verplicht wanneer consequentie van toepassing is');
      return;
    }

    console.log('🚀 STARTING RECURRING SAVE PROCESS');
    console.log('🚀 Recurring form data:', recurringForm);
    console.log('🚀 Editing recurring:', editingRecurring);

    if (editingRecurring) {
      // Update existing recurring
      setRecurringAgreements(recurringAgreements.map(r => 
        r.id === editingRecurring.id 
          ? { ...r, ...recurringForm }
          : r
      ));
      alert('Herhalingsafspraak bijgewerkt!');
    } else {
      // Create new recurring - USE DIRECT SAVE
      const success = await saveRecurringDirectly(recurringForm);
      if (!success) {
        console.error('❌ Recurring save failed');
        return;
      }
    }

    setShowRecurringForm(false);
  };

  // Rest of the component functions remain the same...
  const getMeetingInfo = () => {
    const now = new Date();
    const sortedMeetings = [...participantMeetings].sort((a, b) => {
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

  const getRecurringStatistics = (recurringId) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const prevMonthStr = previousMonth.toISOString().slice(0, 7);

    const currentReport = recurringReports.find(r => r.recurringId === recurringId && r.month === currentMonth);
    const previousReport = recurringReports.find(r => r.recurringId === recurringId && r.month === prevMonthStr);

    const recurring = participantRecurring.find(r => r.id === recurringId);
    const isResultMethod = recurring?.afspraakmethode === 'resultaat';

    if (isResultMethod) {
      const currentValues = currentReport?.values || {};
      const previousValues = previousReport?.values || {};

      const currentTotal = Object.values(currentValues).reduce((sum, val) => sum + val, 0);
      const currentCount = Object.values(currentValues).length;
      const currentAvg = currentCount > 0 ? (currentTotal / currentCount).toFixed(1) : '0.0';

      const previousTotal = Object.values(previousValues).reduce((sum, val) => sum + val, 0);
      const previousCount = Object.values(previousValues).length;
      const previousAvg = previousCount > 0 ? (previousTotal / previousCount).toFixed(1) : '0.0';

      return {
        current: `${currentTotal.toFixed(1)} totaal (⌀ ${currentAvg})`,
        previous: `${previousTotal.toFixed(1)} totaal (⌀ ${previousAvg})`
      };
    } else {
      return {
        current: `${currentReport ? currentReport.completedDays.length : 0} dagen`,
        previous: `${previousReport ? previousReport.completedDays.length : 0} dagen`
      };
    }
  };

  // ... (rest of the component functions remain the same)

  const mainGoals = participantGoals.filter(g => !g.parentId);
  const getSubgoals = (parentId) => participantGoals.filter(g => g.parentId === parentId);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color-outer,#f3f4f6)' }}>
      {/* App Header */}
      {(themeSettings.logoUrl || themeSettings.appName !== 'Coaching App') && (
        <div style={{ backgroundColor: 'var(--bg-color-container,#ffffff)' }} className="py-2">
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
      <div style={{ backgroundColor: 'var(--bg-color-container,#ffffff)' }} className="min-h-screen">
        <div 
          className={`mx-auto ${themeSettings.useMaxWidth ? 'max-w-7xl' : ''}`}
          style={themeSettings.useMaxWidth ? { maxWidth: themeSettings.containerMaxWidth } : {}}
        >
          {/* User Header */}
          <header style={{ backgroundColor: 'var(--header-bg-color,#ffffff)' }} className="shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-6"
                >
                  <SafeIcon icon={FiArrowLeft} />
                  Terug
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {participant.voornaam} {participant.achternaam}
                  </h1>
                  <p className="text-sm text-gray-600">@{participant.nickname}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {/* DEBUG INFO */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">🔍 Debug Info:</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Organization ID:</strong> {user?.organizationId || 'null'}</p>
                <p><strong>Participant ID:</strong> {id}</p>
                <p><strong>Current Goals:</strong> {participantGoals.length}</p>
                <p><strong>Current Recurring:</strong> {participantRecurring.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Doelafspraken */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <SafeIcon icon={FiTarget} className="text-blue-600" />
                    Doelafspraken
                  </h2>
                  <button
                    onClick={() => handleAddGoal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <SafeIcon icon={FiPlus} />
                    Nieuw doel
                  </button>
                </div>

                <div className="space-y-4">
                  {mainGoals.map((goal) => {
                    const subgoals = getSubgoals(goal.id);
                    return (
                      <div key={goal.id} style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow">
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{goal.omschrijving}</h3>
                              <p className="text-sm text-gray-600">Streefdatum: {goal.streefdatum}</p>
                              <p className="text-sm text-gray-600">Rapportage: {goal.rapportagefrequentie}</p>
                              {goal.consequentieVanToepassing === 'ja' && goal.consequentie && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Consequentie:</span> {goal.consequentie}
                                  </p>
                                </div>
                              )}
                              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                                goal.status === 'nog niet begonnen' 
                                  ? 'bg-gray-100 text-gray-800' 
                                  : goal.status === 'bezig' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {goal.status}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditGoal(goal)}
                                className="p-2 text-indigo-600 hover:text-indigo-700"
                                title="Bewerken"
                              >
                                <SafeIcon icon={FiEdit2} />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal)}
                                className="p-2 text-red-600 hover:text-red-700"
                                title="Verwijderen"
                              >
                                <SafeIcon icon={FiTrash2} />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddGoal(goal.id)}
                            className="mt-4 flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <SafeIcon icon={FiPlus} />
                            Subdoel toevoegen
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {mainGoals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nog geen doelafspraken toegevoegd
                    </div>
                  )}
                </div>
              </div>

              {/* Herhalingsafspraken */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <SafeIcon icon={FiRepeat} className="text-purple-600" />
                    Herhalingsafspraken
                  </h2>
                  <button
                    onClick={handleAddRecurring}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <SafeIcon icon={FiPlus} />
                    Nieuwe afspraak
                  </button>
                </div>

                <div className="space-y-4">
                  {participantRecurring.map((recurring) => {
                    const stats = getRecurringStatistics(recurring.id);
                    return (
                      <div key={recurring.id} style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }} className="rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{recurring.rubriek}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Doel:</span> {recurring.afspraakdoel}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Actie:</span> {recurring.afspraakactie}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Notitie:</span> {recurring.afspraaknotitie}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Frequentie:</span> {recurring.afspraakfrequentie}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Methode:</span> {recurring.afspraakmethode || 'nee/ja'}
                            </p>
                            
                            {/* Consequentie weergave */}
                            {recurring.consequentieVanToepassing === 'ja' && recurring.consequentie && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Consequentie:</span> {recurring.consequentie}
                                </p>
                              </div>
                            )}

                            {/* Statistieken */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-gray-900 mb-2">Statistieken:</h4>
                              <div className="text-sm text-gray-600">
                                <div><span className="font-medium">Deze maand:</span> {stats.current}</div>
                                <div><span className="font-medium">Vorige maand:</span> {stats.previous}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRecurring(recurring)}
                              className="p-2 text-indigo-600 hover:text-indigo-700"
                              title="Bewerken"
                            >
                              <SafeIcon icon={FiEdit2} />
                            </button>
                            <button
                              onClick={() => handleDeleteRecurring(recurring)}
                              className="p-2 text-red-600 hover:text-red-700"
                              title="Verwijderen"
                            >
                              <SafeIcon icon={FiTrash2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {participantRecurring.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nog geen herhalingsafspraken toegevoegd
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Form Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}
            className="rounded-lg shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingGoal ? 'Doel bewerken' : goalForm.isSubgoal ? 'Subdoel toevoegen' : 'Nieuw doel'}
              </h3>
              <button
                onClick={() => setShowGoalForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Omschrijving *
                </label>
                <input
                  type="text"
                  value={goalForm.omschrijving}
                  onChange={(e) => setGoalForm({ ...goalForm, omschrijving: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streefdatum *
                </label>
                <input
                  type="date"
                  value={goalForm.streefdatum}
                  onChange={(e) => setGoalForm({ ...goalForm, streefdatum: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rapportagefrequentie
                </label>
                <select
                  value={goalForm.rapportagefrequentie}
                  onChange={(e) => setGoalForm({ ...goalForm, rapportagefrequentie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                >
                  <option value="wekelijks">Wekelijks</option>
                  <option value="tweewekelijks">Tweewekelijks</option>
                  <option value="maandelijks">Maandelijks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consequentie van toepassing?
                </label>
                <select
                  value={goalForm.consequentieVanToepassing}
                  onChange={(e) => setGoalForm({ ...goalForm, consequentieVanToepassing: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                >
                  <option value="nee">Nee</option>
                  <option value="ja">Ja</option>
                </select>
              </div>

              {goalForm.consequentieVanToepassing === 'ja' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consequentie *
                  </label>
                  <textarea
                    value={goalForm.consequentie}
                    onChange={(e) => setGoalForm({ ...goalForm, consequentie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                    rows="3"
                    placeholder="Beschrijf de consequentie..."
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiSave} />
                Opslaan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recurring Form Modal */}
      {showRecurringForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ backgroundColor: 'var(--bg-color-cards,#ffffff)' }}
            className="rounded-lg shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingRecurring ? 'Herhalingsafspraak bewerken' : 'Nieuwe herhalingsafspraak'}
              </h3>
              <button
                onClick={() => setShowRecurringForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rubriek *
                </label>
                <input
                  type="text"
                  value={recurringForm.rubriek}
                  onChange={(e) => setRecurringForm({ ...recurringForm, rubriek: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                  placeholder="bijv. Afvallen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Afspraakdoel *
                </label>
                <input
                  type="text"
                  value={recurringForm.afspraakdoel}
                  onChange={(e) => setRecurringForm({ ...recurringForm, afspraakdoel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                  placeholder="bijv. Voldoende bewegen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Afspraakactie
                </label>
                <input
                  type="text"
                  value={recurringForm.afspraakactie}
                  onChange={(e) => setRecurringForm({ ...recurringForm, afspraakactie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                  placeholder="bijv. naar de sportschool"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Afspraaknotitie
                </label>
                <input
                  type="text"
                  value={recurringForm.afspraaknotitie}
                  onChange={(e) => setRecurringForm({ ...recurringForm, afspraaknotitie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                  placeholder="bijv. een kruisje bij minimaal 45 minuten sporten"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Afspraakfrequentie
                </label>
                <input
                  type="text"
                  value={recurringForm.afspraakfrequentie}
                  onChange={(e) => setRecurringForm({ ...recurringForm, afspraakfrequentie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                  placeholder="bijv. minimaal 3 keer per week"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Afspraakmethode
                </label>
                <select
                  value={recurringForm.afspraakmethode}
                  onChange={(e) => setRecurringForm({ ...recurringForm, afspraakmethode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                >
                  <option value="nee/ja">Nee/Ja (dagen aanklikken)</option>
                  <option value="resultaat">Resultaat (getallen invoeren)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consequentie van toepassing?
                </label>
                <select
                  value={recurringForm.consequentieVanToepassing}
                  onChange={(e) => setRecurringForm({ ...recurringForm, consequentieVanToepassing: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                >
                  <option value="nee">Nee</option>
                  <option value="ja">Ja</option>
                </select>
              </div>

              {recurringForm.consequentieVanToepassing === 'ja' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consequentie *
                  </label>
                  <textarea
                    value={recurringForm.consequentie}
                    onChange={(e) => setRecurringForm({ ...recurringForm, consequentie: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ backgroundColor: 'var(--input-bg-color,#ffffff)' }}
                    rows="3"
                    placeholder="Beschrijf de consequentie..."
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRecurringForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveRecurring}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
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

export default CoachParticipantDetail;