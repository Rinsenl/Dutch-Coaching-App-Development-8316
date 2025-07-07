import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { sendEmail, validateEmailSettings, isEmailJSConfigured, getEmailJSSetupInstructions } from '../services/emailService';
import { calculateAge, validateBirthDate, formatDate } from '../utils/dateUtils';
import { testDatabaseAfterReset, checkAllTablesStructure } from '../utils/testDatabaseConnection';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import GetStartedComponent from '../components/GetStartedComponent';

const {
  FiUsers, FiUserPlus, FiLink, FiLogOut, FiEdit2, FiTrash2, FiSave, FiX, FiMail,
  FiPalette, FiSettings, FiUpload, FiCheck, FiAlertTriangle, FiEye, FiRefreshCw,
  FiExternalLink, FiBookOpen, FiUser, FiLock, FiPhone, FiCalendar, FiImage,
  FiGlobe, FiSend, FiEyeOff, FiServer, FiKey, FiShield, FiInfo, FiCake, FiDatabase
} = FiIcons;

const ManagerDashboard = () => {
  const { logout, user } = useAuth();
  const {
    users, setUsers, assignments, setAssignments, emailSettings, setEmailSettings,
    themeSettings, setThemeSettings, emailLogs, setEmailLogs, loading, refreshData
  } = useData();
  
  const [activeTab, setActiveTab] = useState('users');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [birthDateError, setBirthDateError] = useState('');
  const [testing, setTesting] = useState(false);

  const [userForm, setUserForm] = useState({
    nickname: '',
    password: '',
    confirmPassword: '',
    voornaam: '',
    achternaam: '',
    emailadres: '',
    mobiel: '',
    geslacht: 'Man',
    leeftijd: '',
    geboortedatum: '',
    foto: '',
    role: 'participant'
  });

  const [emailForm, setEmailForm] = useState({
    senderEmail: emailSettings.senderEmail || '',
    senderName: emailSettings.senderName || '',
    enabled: emailSettings.enabled || false
  });

  const [themeForm, setThemeForm] = useState({
    appName: themeSettings.appName || 'Coaching App',
    logoUrl: themeSettings.logoUrl || '',
    containerMaxWidth: themeSettings.containerMaxWidth || '1290px',
    useMaxWidth: themeSettings.useMaxWidth !== undefined ? themeSettings.useMaxWidth : true,
    backgroundColorOuter: themeSettings.backgroundColorOuter || '#8a1708',
    backgroundColorContainer: themeSettings.backgroundColorContainer || '#f7e6d9',
    backgroundColorCards: themeSettings.backgroundColorCards || '#edede6',
    inputBackgroundColor: themeSettings.inputBackgroundColor || '#ffffff',
    buttonBackgroundColor: themeSettings.buttonBackgroundColor || '#33a370',
    buttonHoverColor: themeSettings.buttonHoverColor || '#8a1708',
    buttonTextColor: themeSettings.buttonTextColor || '#ffffff',
    headerBackgroundColor: themeSettings.headerBackgroundColor || '#edede6',
    primaryIconColor: themeSettings.primaryIconColor || '#3B82F6',
    secondaryIconColor: themeSettings.secondaryIconColor || '#6B7280'
  });

  // Update forms when data changes
  React.useEffect(() => {
    setEmailForm({
      senderEmail: emailSettings.senderEmail || '',
      senderName: emailSettings.senderName || '',
      enabled: emailSettings.enabled || false
    });
  }, [emailSettings]);

  React.useEffect(() => {
    setThemeForm({
      appName: themeSettings.appName || 'Coaching App',
      logoUrl: themeSettings.logoUrl || '',
      containerMaxWidth: themeSettings.containerMaxWidth || '1290px',
      useMaxWidth: themeSettings.useMaxWidth !== undefined ? themeSettings.useMaxWidth : true,
      backgroundColorOuter: themeSettings.backgroundColorOuter || '#8a1708',
      backgroundColorContainer: themeSettings.backgroundColorContainer || '#f7e6d9',
      backgroundColorCards: themeSettings.backgroundColorCards || '#edede6',
      inputBackgroundColor: themeSettings.inputBackgroundColor || '#ffffff',
      buttonBackgroundColor: themeSettings.buttonBackgroundColor || '#33a370',
      buttonHoverColor: themeSettings.buttonHoverColor || '#8a1708',
      buttonTextColor: themeSettings.buttonTextColor || '#ffffff',
      headerBackgroundColor: themeSettings.headerBackgroundColor || '#edede6',
      primaryIconColor: themeSettings.primaryIconColor || '#3B82F6',
      secondaryIconColor: themeSettings.secondaryIconColor || '#6B7280'
    });
  }, [themeSettings]);

  const coaches = users.filter(u => u.role === 'coach');
  const participants = users.filter(u => u.role === 'participant');

  // Handle birth date changes and auto-calculate age
  const handleBirthDateChange = (birthDate) => {
    setUserForm(prev => ({
      ...prev,
      geboortedatum: birthDate,
      leeftijd: birthDate ? calculateAge(birthDate).toString() : ''
    }));

    // Validate birth date
    const validation = validateBirthDate(birthDate);
    setBirthDateError(validation.isValid ? '' : validation.message);
  };

  // Test database after manual reset
  const handleTestDatabase = async () => {
    setTesting(true);
    setDebugInfo('🔍 Testing database connection and structure...');
    
    try {
      const testResult = await testDatabaseAfterReset();
      const structureResult = await checkAllTablesStructure();
      
      if (testResult) {
        setDebugInfo('✅ Database test SUCCESSFUL! All tables working correctly.\n\nTable Status:\n' + 
          Object.entries(structureResult).map(([table, status]) => `${table}: ${status}`).join('\n'));
        alert('✅ Database werkt correct! Je kunt nu veilig gebruikers aanmaken en bewerken.');
      } else {
        setDebugInfo('❌ Database test FAILED. Check the manual SQL reset instructions.\n\nTable Status:\n' + 
          Object.entries(structureResult).map(([table, status]) => `${table}: ${status}`).join('\n'));
        alert('❌ Database test mislukt. Volg de handmatige SQL instructies.');
      }
    } catch (error) {
      setDebugInfo(`❌ Database test error: ${error.message}`);
      alert('❌ Database test fout: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      nickname: '',
      password: '',
      confirmPassword: '',
      voornaam: '',
      achternaam: '',
      emailadres: '',
      mobiel: '',
      geslacht: 'Man',
      leeftijd: '',
      geboortedatum: '',
      foto: '',
      role: 'participant'
    });
    setDebugInfo('');
    setBirthDateError('');
    setShowUserForm(true);
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setUserForm({
      ...userToEdit,
      confirmPassword: userToEdit.password,
      leeftijd: userToEdit.leeftijd?.toString() || ''
    });
    setDebugInfo('');
    setBirthDateError('');
    setShowUserForm(true);
  };

  const handleSaveUser = async () => {
    console.log('🚀 Starting handleSaveUser...');
    setDebugInfo('Validating form data...');

    // Basic validation
    if (!userForm.nickname || !userForm.password) {
      const error = 'Gebruikersnaam en wachtwoord zijn verplicht';
      setDebugInfo('❌ ' + error);
      alert(error);
      return;
    }

    if (userForm.password !== userForm.confirmPassword) {
      const error = 'Wachtwoorden komen niet overeen';
      setDebugInfo('❌ ' + error);
      alert(error);
      return;
    }

    // Validate birth date if provided
    if (userForm.geboortedatum) {
      const validation = validateBirthDate(userForm.geboortedatum);
      if (!validation.isValid) {
        setDebugInfo('❌ ' + validation.message);
        alert(validation.message);
        return;
      }
    }

    // Check if nickname already exists
    const existingUser = users.find(u => u.nickname === userForm.nickname && u.id !== editingUser?.id);
    if (existingUser) {
      const error = 'Deze gebruikersnaam bestaat al';
      setDebugInfo('❌ ' + error);
      alert(error);
      return;
    }

    setSaving(true);
    setDebugInfo('Starting save operation...');

    try {
      const { confirmPassword, ...userData } = userForm;
      
      // Auto-calculate age from birth date if provided
      const finalUserData = {
        ...userData,
        leeftijd: userData.geboortedatum ? calculateAge(userData.geboortedatum) : (parseInt(userData.leeftijd) || 0)
      };

      if (editingUser) {
        setDebugInfo('Updating existing user...');
        const updatedUsers = users.map(u =>
          u.id === editingUser.id
            ? { ...finalUserData, id: editingUser.id, organizationId: user.organizationId }
            : u
        );
        await setUsers(updatedUsers);
      } else {
        setDebugInfo('Creating new user...');
        const newUser = {
          ...finalUserData,
          id: crypto.randomUUID(),
          organizationId: user.organizationId
        };
        await setUsers([...users, newUser]);
      }

      setShowUserForm(false);
      setDebugInfo('✅ User saved successfully!');
      alert('Gebruiker succesvol opgeslagen!');
    } catch (error) {
      console.error('❌ Error saving user:', error);
      const errorMessage = `Detailed error: ${error.message || 'Unknown error'}`;
      setDebugInfo('❌ ' + errorMessage);
      alert('Fout bij opslaan van gebruiker: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) {
      try {
        const updatedUsers = users.filter(u => u.id !== userId);
        const updatedAssignments = assignments.filter(a => a.coachId !== userId && a.participantId !== userId);
        await setUsers(updatedUsers);
        await setAssignments(updatedAssignments);
        alert('Gebruiker succesvol verwijderd!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Fout bij verwijderen van gebruiker: ' + error.message);
      }
    }
  };

  const handleAssignParticipant = async (coachId, participantId) => {
    try {
      const existingAssignment = assignments.find(a => a.participantId === participantId);
      
      if (existingAssignment) {
        const updatedAssignments = assignments.map(a =>
          a.participantId === participantId
            ? { ...a, coachId, organizationId: user.organizationId }
            : a
        );
        await setAssignments(updatedAssignments);
      } else {
        const newAssignment = {
          id: crypto.randomUUID(),
          coachId,
          participantId,
          organizationId: user.organizationId
        };
        await setAssignments([...assignments, newAssignment]);
      }
      
      alert('Deelnemer succesvol toegewezen!');
    } catch (error) {
      console.error('Error assigning participant:', error);
      alert('Fout bij toewijzen van deelnemer: ' + error.message);
    }
  };

  const getParticipantCoach = (participantId) => {
    const assignment = assignments.find(a => a.participantId === participantId);
    return assignment ? coaches.find(c => c.id === assignment.coachId) : null;
  };

  const handleSaveEmailSettings = async () => {
    const errors = validateEmailSettings(emailForm);
    if (errors.length > 0) {
      alert('Validatiefouten:\n' + errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      await setEmailSettings({
        ...emailForm,
        organizationId: user.organizationId
      });
      alert('E-mail instellingen opgeslagen!');
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('Fout bij opslaan van e-mail instellingen: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestEmailSending(true);
    setEmailTestResult(null);

    const testEmailData = {
      to: emailForm.senderEmail,
      subject: 'Test E-mail - Coaching App',
      body: `Dit is een test e-mail verzonden op ${new Date().toLocaleString('nl-NL')}.\n\nAls je deze e-mail ontvangt, werkt de configuratie correct!`
    };

    try {
      const result = await sendEmail(emailForm, testEmailData);
      setEmailTestResult(result);

      const logEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type: 'test',
        to: testEmailData.to,
        subject: testEmailData.subject,
        success: result.success,
        error: result.error || null,
        messageId: result.messageId || null,
        organizationId: user.organizationId
      };

      await setEmailLogs([logEntry, ...emailLogs]);

      if (result.success) {
        const message = result.note
          ? `Test e-mail succesvol verzonden!\n\nNote: ${result.note}`
          : 'Test e-mail succesvol verzonden!';
        alert(message);
      } else {
        alert(`Test e-mail mislukt: ${result.error}`);
      }
    } catch (error) {
      setEmailTestResult({ success: false, error: error.message });
      alert(`Test e-mail mislukt: ${error.message}`);
    }

    setTestEmailSending(false);
  };

  const handleSaveThemeSettings = async () => {
    setSaving(true);
    try {
      await setThemeSettings({
        ...themeForm,
        organizationId: user.organizationId
      });
      alert('Thema instellingen opgeslagen!');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      alert('Fout bij opslaan van thema instellingen: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setThemeForm({ ...themeForm, logoUrl: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if user is a manager for the correct organization
  if (!user || user.role !== 'manager') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Toegang Geweigerd</h1>
          <p className="text-gray-600 mb-4">Je hebt geen manager rechten voor deze organisatie.</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Uitloggen
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color-outer, #f3f4f6)' }}>
        <div className="flex items-center gap-3">
          <SafeIcon icon={FiRefreshCw} className="text-2xl text-blue-600 animate-spin" />
          <span className="text-lg">Laden van gegevens...</span>
        </div>
      </div>
    );
  }

  const emailJSConfigured = isEmailJSConfigured();
  const setupInstructions = getEmailJSSetupInstructions();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color-outer, #f3f4f6)' }}>
      {/* App Header */}
      {(themeForm.logoUrl || themeForm.appName !== 'Coaching App') && (
        <div style={{ backgroundColor: 'var(--bg-color-container, #ffffff)' }} className="py-2">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${themeForm.useMaxWidth ? 'max-w-7xl' : ''}`}
            style={themeForm.useMaxWidth ? { maxWidth: themeForm.containerMaxWidth } : {}}
          >
            <div className="flex items-center gap-4">
              {themeForm.logoUrl && (
                <img src={themeForm.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{themeForm.appName}</h1>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ backgroundColor: 'var(--bg-color-container, #ffffff)' }} className="min-h-screen">
        <div className={`mx-auto ${themeForm.useMaxWidth ? 'max-w-7xl' : ''}`}
          style={themeForm.useMaxWidth ? { maxWidth: themeForm.containerMaxWidth } : {}}
        >
          {/* Header */}
          <header style={{ backgroundColor: 'var(--header-bg-color, #ffffff)' }} className="shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    <SafeIcon icon={FiCheck} className="text-xs" />
                    <span>{user.organizationName}</span>
                  </div>
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
                    onClick={refreshData}
                    className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                    title="Gegevens vernieuwen"
                  >
                    <SafeIcon icon={FiRefreshCw} />
                    Vernieuwen
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
            {/* Organization Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <SafeIcon icon={FiInfo} className="text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Organisatie: {user.organizationName}</h3>
                  <p className="text-sm text-blue-700">
                    Je beheert de data voor deze organisatie. Alle gebruikers, doelen en instellingen zijn specifiek voor jouw organisatie.
                  </p>
                </div>
              </div>
            </div>

            {/* MANUAL DATABASE RESET INSTRUCTIONS */}
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <SafeIcon icon={FiDatabase} className="text-red-600" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">🔧 Handmatige Database Reset Nodig</h3>
                    <p className="text-sm text-red-700">
                      Automatische reset werkt niet. Gebruik de handmatige SQL instructies in DIRECT_DATABASE_FIX.md
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      1. Open Supabase Dashboard → SQL Editor → Kopieer SQL uit DIRECT_DATABASE_FIX.md → RUN
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleTestDatabase}
                  disabled={testing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {testing ? '🔍 Testing...' : '🔍 Test Database'}
                </button>
              </div>
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <SafeIcon icon={FiInfo} className="text-yellow-600" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
                    <pre className="text-sm text-yellow-700 whitespace-pre-wrap font-mono">{debugInfo}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'users' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'users' 
                  ? { backgroundColor: 'var(--button-bg-color, #3B82F6)' }
                  : { backgroundColor: 'var(--bg-color-cards, #ffffff)' }
                }
              >
                <SafeIcon icon={FiUsers} className="inline mr-2" />
                Gebruikers
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'assignments' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'assignments' 
                  ? { backgroundColor: 'var(--button-bg-color, #3B82F6)' }
                  : { backgroundColor: 'var(--bg-color-cards, #ffffff)' }
                }
              >
                <SafeIcon icon={FiLink} className="inline mr-2" />
                Koppelingen
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'email' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'email' 
                  ? { backgroundColor: 'var(--button-bg-color, #3B82F6)' }
                  : { backgroundColor: 'var(--bg-color-cards, #ffffff)' }
                }
              >
                <SafeIcon icon={FiMail} className="inline mr-2" />
                E-mail
              </button>
              <button
                onClick={() => setActiveTab('theme')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'theme' ? 'text-white' : 'text-gray-700 hover:opacity-80'
                }`}
                style={activeTab === 'theme' 
                  ? { backgroundColor: 'var(--button-bg-color, #3B82F6)' }
                  : { backgroundColor: 'var(--bg-color-cards, #ffffff)' }
                }
              >
                <SafeIcon icon={FiPalette} className="inline mr-2" />
                Thema
              </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Gebruikers beheren</h2>
                  <button
                    onClick={handleAddUser}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium"
                    style={{ backgroundColor: 'var(--button-bg-color, #3B82F6)' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--button-hover-color, #2563EB)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--button-bg-color, #3B82F6)'}
                  >
                    <SafeIcon icon={FiUserPlus} />
                    Gebruiker toevoegen
                  </button>
                </div>

                <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gebruiker
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Leeftijd
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acties
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                      {users.filter(u => u.role !== 'admin').map((userItem) => (
                        <tr key={userItem.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {userItem.voornaam} {userItem.achternaam}
                              </div>
                              <div className="text-sm text-gray-500">@{userItem.nickname}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userItem.role === 'coach' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {userItem.role === 'coach' ? 'Begeleider' : 'Deelnemer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{userItem.emailadres}</div>
                            <div>{userItem.mobiel}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <SafeIcon icon={FiCake} className="text-gray-400" />
                              {userItem.leeftijd ? `${userItem.leeftijd} jaar` : 'Onbekend'}
                            </div>
                            {userItem.geboortedatum && (
                              <div className="text-xs text-gray-400">
                                {formatDate(userItem.geboortedatum)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditUser(userItem)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
                            >
                              <SafeIcon icon={FiEdit2} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <SafeIcon icon={FiTrash2} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.filter(u => u.role !== 'admin').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nog geen gebruikers aangemaakt voor deze organisatie.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rest of the component remains the same... */}
            {/* Assignments Tab */}
            {activeTab === 'assignments' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Deelnemers koppelen aan begeleiders</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coaches */}
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Begeleiders ({coaches.length})</h3>
                    <div className="space-y-3">
                      {coaches.map(coach => (
                        <div key={coach.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <SafeIcon icon={FiUser} className="text-green-600" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {coach.voornaam} {coach.achternaam}
                            </div>
                            <div className="text-sm text-gray-600">{coach.emailadres}</div>
                          </div>
                        </div>
                      ))}
                      {coaches.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Geen begeleiders aanwezig</p>
                      )}
                    </div>
                  </div>

                  {/* Participants */}
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Deelnemers ({participants.length})</h3>
                    <div className="space-y-3">
                      {participants.map(participant => {
                        const assignedCoach = getParticipantCoach(participant.id);
                        return (
                          <div key={participant.id} className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {participant.voornaam} {participant.achternaam}
                                </div>
                                <div className="text-sm text-gray-600">{participant.emailadres}</div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Toegewezen begeleider:
                              </label>
                              <select
                                value={assignedCoach?.id || ''}
                                onChange={(e) => e.target.value && handleAssignParticipant(e.target.value, participant.id)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                              >
                                <option value="">Geen begeleider toegewezen</option>
                                {coaches.map(coach => (
                                  <option key={coach.id} value={coach.id}>
                                    {coach.voornaam} {coach.achternaam}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                      {participants.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Geen deelnemers aanwezig</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email and Theme tabs remain the same... */}
            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">E-mail instellingen</h2>

                {/* EmailJS Setup Status */}
                <div className={`p-4 rounded-lg border ${
                  emailJSConfigured 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <SafeIcon icon={emailJSConfigured ? FiCheck : FiAlertTriangle} 
                      className={emailJSConfigured ? 'text-green-600' : 'text-yellow-600'} />
                    <h3 className="font-medium">
                      EmailJS Status: {emailJSConfigured ? 'Geconfigureerd' : 'Configuratie Vereist'}
                    </h3>
                  </div>
                  {!emailJSConfigured && (
                    <div className="text-sm text-yellow-800">
                      <p className="mb-2">EmailJS is niet volledig geconfigureerd. Setup instructies:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {setupInstructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Settings Form */}
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">E-mail configuratie</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={emailForm.enabled}
                            onChange={(e) => setEmailForm({ ...emailForm, enabled: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">E-mail verzending inschakelen</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verzender naam *
                        </label>
                        <input
                          type="text"
                          value={emailForm.senderName}
                          onChange={(e) => setEmailForm({ ...emailForm, senderName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                          placeholder="Coaching App"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Verzender e-mailadres *
                        </label>
                        <input
                          type="email"
                          value={emailForm.senderEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, senderEmail: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                          placeholder="noreply@coaching-app.com"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSaveEmailSettings}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <SafeIcon icon={FiSave} />
                          {saving ? 'Opslaan...' : 'Opslaan'}
                        </button>
                        <button
                          onClick={handleTestEmail}
                          disabled={testEmailSending || !emailForm.enabled}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <SafeIcon icon={FiSend} />
                          {testEmailSending ? 'Versturen...' : 'Test e-mail'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Logs */}
                  <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recente e-mail logs</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {emailLogs.slice(0, 10).map(log => (
                        <div key={log.id} className={`p-3 rounded-lg border ${
                          log.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {log.type === 'test' ? 'Test e-mail' : 'Overzicht e-mail'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.success ? 'Succesvol' : 'Mislukt'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <div>Naar: {log.to}</div>
                            <div>Tijd: {new Date(log.timestamp).toLocaleString()}</div>
                            {log.error && <div className="text-red-600">Fout: {log.error}</div>}
                          </div>
                        </div>
                      ))}
                      {emailLogs.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Geen e-mail logs beschikbaar</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Thema instellingen</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Theme Settings Form */}
                  <div className="space-y-6">
                    {/* Basic Settings */}
                    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basis instellingen</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">App naam</label>
                          <input
                            type="text"
                            value={themeForm.appName}
                            onChange={(e) => setThemeForm({ ...themeForm, appName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              value={themeForm.logoUrl}
                              onChange={(e) => setThemeForm({ ...themeForm, logoUrl: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                              placeholder="https://example.com/logo.png"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                              id="logo-upload"
                            />
                            <label
                              htmlFor="logo-upload"
                              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-2"
                            >
                              <SafeIcon icon={FiUpload} />
                              Upload
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={themeForm.useMaxWidth}
                              onChange={(e) => setThemeForm({ ...themeForm, useMaxWidth: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Container max breedte gebruiken</span>
                          </label>
                        </div>

                        {themeForm.useMaxWidth && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Container max breedte</label>
                            <input
                              type="text"
                              value={themeForm.containerMaxWidth}
                              onChange={(e) => setThemeForm({ ...themeForm, containerMaxWidth: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                              placeholder="1290px"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Color Settings */}
                    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Kleuren</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Outer Background</label>
                          <input
                            type="color"
                            value={themeForm.backgroundColorOuter}
                            onChange={(e) => setThemeForm({ ...themeForm, backgroundColorOuter: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Container Background</label>
                          <input
                            type="color"
                            value={themeForm.backgroundColorContainer}
                            onChange={(e) => setThemeForm({ ...themeForm, backgroundColorContainer: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cards Background</label>
                          <input
                            type="color"
                            value={themeForm.backgroundColorCards}
                            onChange={(e) => setThemeForm({ ...themeForm, backgroundColorCards: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Input Background</label>
                          <input
                            type="color"
                            value={themeForm.inputBackgroundColor}
                            onChange={(e) => setThemeForm({ ...themeForm, inputBackgroundColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Button Color</label>
                          <input
                            type="color"
                            value={themeForm.buttonBackgroundColor}
                            onChange={(e) => setThemeForm({ ...themeForm, buttonBackgroundColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Button Hover</label>
                          <input
                            type="color"
                            value={themeForm.buttonHoverColor}
                            onChange={(e) => setThemeForm({ ...themeForm, buttonHoverColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                          <input
                            type="color"
                            value={themeForm.buttonTextColor}
                            onChange={(e) => setThemeForm({ ...themeForm, buttonTextColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Header Background</label>
                          <input
                            type="color"
                            value={themeForm.headerBackgroundColor}
                            onChange={(e) => setThemeForm({ ...themeForm, headerBackgroundColor: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="space-y-6">
                    <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Voorbeeld</h3>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: themeForm.backgroundColorOuter }}>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: themeForm.backgroundColorContainer }}>
                          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: themeForm.headerBackgroundColor }}>
                            <h4 className="font-semibold text-gray-900">Header</h4>
                          </div>
                          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: themeForm.backgroundColorCards }}>
                            <p className="text-gray-700 mb-3">Dit is een voorbeeld card</p>
                            <input
                              type="text"
                              placeholder="Voorbeeld input"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                              style={{ backgroundColor: themeForm.inputBackgroundColor }}
                            />
                            <button
                              className="px-4 py-2 rounded-md font-medium"
                              style={{
                                backgroundColor: themeForm.buttonBackgroundColor,
                                color: themeForm.buttonTextColor
                              }}
                            >
                              Voorbeeld Button
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveThemeSettings}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      <SafeIcon icon={FiSave} />
                      {saving ? 'Opslaan...' : 'Thema instellingen opslaan'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Form Modal remains the same... */}
      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto"
            style={{ backgroundColor: 'var(--bg-color-cards, #ffffff)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingUser ? 'Gebruiker bewerken' : 'Nieuwe gebruiker'}
              </h3>
              <button
                onClick={() => setShowUserForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            {debugInfo && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <strong>Debug:</strong> <pre className="whitespace-pre-wrap font-mono">{debugInfo}</pre>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gebruikersnaam *
                </label>
                <input
                  type="text"
                  value={userForm.nickname}
                  onChange={(e) => setUserForm({ ...userForm, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                >
                  <option value="participant">Deelnemer</option>
                  <option value="coach">Begeleider</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voornaam
                </label>
                <input
                  type="text"
                  value={userForm.voornaam}
                  onChange={(e) => setUserForm({ ...userForm, voornaam: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Achternaam
                </label>
                <input
                  type="text"
                  value={userForm.achternaam}
                  onChange={(e) => setUserForm({ ...userForm, achternaam: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres
                </label>
                <input
                  type="email"
                  value={userForm.emailadres}
                  onChange={(e) => setUserForm({ ...userForm, emailadres: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobiel
                </label>
                <input
                  type="tel"
                  value={userForm.mobiel}
                  onChange={(e) => setUserForm({ ...userForm, mobiel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geslacht
                </label>
                <select
                  value={userForm.geslacht}
                  onChange={(e) => setUserForm({ ...userForm, geslacht: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                >
                  <option value="Man">Man</option>
                  <option value="Vrouw">Vrouw</option>
                  <option value="Anders">Anders</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <SafeIcon icon={FiCalendar} />
                    Geboortedatum
                  </span>
                </label>
                <input
                  type="date"
                  value={userForm.geboortedatum}
                  onChange={(e) => handleBirthDateChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    birthDateError ? 'border-red-300' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
                {birthDateError && (
                  <p className="text-red-600 text-xs mt-1">{birthDateError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <SafeIcon icon={FiCake} />
                    Leeftijd
                  </span>
                </label>
                <input
                  type="number"
                  value={userForm.leeftijd}
                  onChange={(e) => setUserForm({ ...userForm, leeftijd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                  min="0"
                  max="120"
                  readOnly={!!userForm.geboortedatum}
                  placeholder={userForm.geboortedatum ? 'Wordt automatisch berekend' : 'Voer leeftijd in'}
                />
                {userForm.geboortedatum && (
                  <p className="text-green-600 text-xs mt-1">
                    Automatisch berekend uit geboortedatum
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto URL
                </label>
                <input
                  type="url"
                  value={userForm.foto}
                  onChange={(e) => setUserForm({ ...userForm, foto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wachtwoord *
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bevestig wachtwoord *
                </label>
                <input
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm({ ...userForm, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: 'var(--input-bg-color, #ffffff)' }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUserForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving || !!birthDateError}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--button-bg-color, #3B82F6)' }}
                onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = 'var(--button-hover-color, #2563EB)')}
                onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = 'var(--button-bg-color, #3B82F6)')}
              >
                <SafeIcon icon={FiSave} />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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

export default ManagerDashboard;