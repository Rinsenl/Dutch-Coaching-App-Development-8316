import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { useAuth } from './AuthContext';
import { calculateAge } from '../utils/dateUtils';
import { completeResetAndRebuild } from '../utils/completeReset';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsersState] = useState([]);
  const [assignments, setAssignmentsState] = useState([]);
  const [goalAgreements, setGoalAgreements] = useState([]);
  const [recurringAgreements, setRecurringAgreements] = useState([]);
  const [reports, setReports] = useState([]);
  const [notes, setNotes] = useState([]);
  const [recurringReports, setRecurringReports] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [emailSettings, setEmailSettingsState] = useState({
    senderEmail: '',
    senderName: '',
    smtpHost: '',
    smtpPort: 587,
    username: '',
    password: '',
    useTLS: true,
    enabled: false
  });
  const [themeSettings, setThemeSettingsState] = useState({
    appName: 'Coaching App',
    logoUrl: '',
    containerMaxWidth: '1290px',
    useMaxWidth: true,
    backgroundColorOuter: '#8a1708',
    backgroundColorContainer: '#f7e6d9',
    backgroundColorCards: '#edede6',
    inputBackgroundColor: '#ffffff',
    buttonBackgroundColor: '#33a370',
    buttonHoverColor: '#8a1708',
    buttonTextColor: '#ffffff',
    headerBackgroundColor: '#edede6',
    primaryIconColor: '#3B82F6',
    secondaryIconColor: '#6B7280'
  });
  const [emailLogs, setEmailLogsState] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get organization ID from current user
  const getOrganizationId = () => {
    if (!user) return null;
    if (user.role === 'admin') return null;
    if (user.role === 'manager' && user.organizationId) return user.organizationId;
    if (user.organizationId) return user.organizationId;
    return null;
  };

  // Complete database reset function
  const resetDatabase = async () => {
    console.log('🔥 Starting complete database reset...');
    try {
      const success = await completeResetAndRebuild();
      if (success) {
        // Clear all local state
        setUsersState([]);
        setAssignmentsState([]);
        setGoalAgreements([]);
        setRecurringAgreements([]);
        setReports([]);
        setNotes([]);
        setRecurringReports([]);
        setMeetings([]);
        setEmailSettingsState({
          senderEmail: '',
          senderName: '',
          smtpHost: '',
          smtpPort: 587,
          username: '',
          password: '',
          useTLS: true,
          enabled: false
        });
        setThemeSettingsState({
          appName: 'Coaching App',
          logoUrl: '',
          containerMaxWidth: '1290px',
          useMaxWidth: true,
          backgroundColorOuter: '#8a1708',
          backgroundColorContainer: '#f7e6d9',
          backgroundColorCards: '#edede6',
          inputBackgroundColor: '#ffffff',
          buttonBackgroundColor: '#33a370',
          buttonHoverColor: '#8a1708',
          buttonTextColor: '#ffffff',
          headerBackgroundColor: '#edede6',
          primaryIconColor: '#3B82F6',
          secondaryIconColor: '#6B7280'
        });
        setEmailLogsState([]);
        console.log('✅ Database reset completed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      return false;
    }
  };

  // FIXED: Save functions using correct table structure
  const setUsers = async (newUsers) => {
    try {
      console.log('🚀 Saving users directly...');
      const organizationId = getOrganizationId();
      console.log('Organization ID:', organizationId);

      // Delete existing users for this organization
      if (organizationId) {
        await supabase
          .from('users_coaching')
          .delete()
          .eq('organization_id', organizationId);
      }

      // Insert new users
      const supabaseUsers = newUsers.map(user => ({
        id: user.id || crypto.randomUUID(),
        nickname: user.nickname || '',
        password: user.password || '',
        voornaam: user.voornaam || '',
        achternaam: user.achternaam || '',
        emailadres: user.emailadres || '',
        mobiel: user.mobiel || '',
        geslacht: user.geslacht || '',
        leeftijd: user.geboortedatum ? calculateAge(user.geboortedatum) : (parseInt(user.leeftijd) || 0),
        geboortedatum: user.geboortedatum || null,
        foto: user.foto || '',
        role: user.role || 'participant',
        organization_id: organizationId
      }));

      const { data, error } = await supabase
        .from('users_coaching')
        .insert(supabaseUsers)
        .select();

      if (error) {
        console.error('Users save error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Users saved successfully');
      setUsersState(newUsers);
      return true;
    } catch (error) {
      console.error('❌ Error saving users:', error);
      throw error;
    }
  };

  const setAssignments = async (newAssignments) => {
    try {
      console.log('🚀 Saving assignments directly...');
      const organizationId = getOrganizationId();

      // Delete existing assignments for this organization
      if (organizationId) {
        await supabase
          .from('assignments_coaching')
          .delete()
          .eq('organization_id', organizationId);
      }

      // Insert new assignments
      const supabaseAssignments = newAssignments.map(assignment => ({
        id: assignment.id || crypto.randomUUID(),
        coach_id: assignment.coachId,
        participant_id: assignment.participantId,
        organization_id: organizationId
      }));

      const { data, error } = await supabase
        .from('assignments_coaching')
        .insert(supabaseAssignments)
        .select();

      if (error) {
        console.error('Assignments save error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Assignments saved successfully');
      setAssignmentsState(newAssignments);
      return true;
    } catch (error) {
      console.error('❌ Error saving assignments:', error);
      throw error;
    }
  };

  // FIXED: Save goal agreements with correct structure
  const saveGoalAgreements = async (newGoals) => {
    try {
      console.log('🚀 Saving goal agreements...');
      const organizationId = getOrganizationId();

      // Convert to Supabase format
      const supabaseGoals = newGoals.map(goal => ({
        id: goal.id || crypto.randomUUID(),
        participant_id: goal.participantId,
        coach_id: goal.coachId,
        parent_id: goal.parentId || null,
        omschrijving: goal.omschrijving,
        streefdatum: goal.streefdatum,
        rapportagefrequentie: goal.rapportagefrequentie,
        status: goal.status || 'nog niet begonnen',
        consequentie_van_toepassing: goal.consequentieVanToepassing || 'nee',
        consequentie: goal.consequentie || null,
        organization_id: organizationId
      }));

      const { error } = await supabase
        .from('goal_agreements_coaching')
        .upsert(supabaseGoals, { onConflict: 'id' });

      if (error) {
        console.error('Goal agreements save error:', error);
        throw error;
      }

      console.log('✅ Goal agreements saved successfully');
      setGoalAgreements(newGoals);
      return true;
    } catch (error) {
      console.error('❌ Error saving goal agreements:', error);
      throw error;
    }
  };

  // FIXED: Save recurring agreements with correct structure
  const saveRecurringAgreements = async (newAgreements) => {
    try {
      console.log('🚀 Saving recurring agreements...');
      const organizationId = getOrganizationId();

      const supabaseAgreements = newAgreements.map(recurring => ({
        id: recurring.id || crypto.randomUUID(),
        participant_id: recurring.participantId,
        coach_id: recurring.coachId,
        rubriek: recurring.rubriek,
        afspraakdoel: recurring.afspraakdoel,
        afspraakactie: recurring.afspraakactie || null,
        afspraaknotitie: recurring.afspraaknotitie || null,
        afspraakfrequentie: recurring.afspraakfrequentie || null,
        afspraakmethode: recurring.afspraakmethode || 'nee/ja',
        consequentie_van_toepassing: recurring.consequentieVanToepassing || 'nee',
        consequentie: recurring.consequentie || null,
        organization_id: organizationId
      }));

      const { error } = await supabase
        .from('recurring_agreements_coaching')
        .upsert(supabaseAgreements, { onConflict: 'id' });

      if (error) {
        console.error('Recurring agreements save error:', error);
        throw error;
      }

      console.log('✅ Recurring agreements saved successfully');
      setRecurringAgreements(newAgreements);
      return true;
    } catch (error) {
      console.error('❌ Error saving recurring agreements:', error);
      throw error;
    }
  };

  // FIXED: Save reports with correct structure
  const saveReports = async (newReports) => {
    try {
      console.log('🚀 Saving reports...');
      const organizationId = getOrganizationId();

      const supabaseReports = newReports.map(report => ({
        id: report.id || crypto.randomUUID(),
        goal_id: report.goalId,
        participant_id: report.participantId,
        tekst: report.tekst,
        datum: report.datum,
        organization_id: organizationId
      }));

      const { error } = await supabase
        .from('reports_coaching')
        .upsert(supabaseReports, { onConflict: 'id' });

      if (error) {
        console.error('Reports save error:', error);
        throw error;
      }

      console.log('✅ Reports saved successfully');
      setReports(newReports);
      return true;
    } catch (error) {
      console.error('❌ Error saving reports:', error);
      throw error;
    }
  };

  // FIXED: Save notes with correct structure
  const saveNotes = async (newNotes) => {
    try {
      console.log('🚀 Saving notes...');
      const organizationId = getOrganizationId();

      const supabaseNotes = newNotes.map(note => ({
        id: note.id || crypto.randomUUID(),
        user_id: note.userId,
        goal_id: note.goalId || null,
        recurring_id: note.recurringId || null,
        text: note.text,
        timestamp: note.timestamp || new Date().toISOString(),
        is_coach_note: note.isCoachNote || false,
        organization_id: organizationId
      }));

      const { error } = await supabase
        .from('notes_coaching')
        .upsert(supabaseNotes, { onConflict: 'id' });

      if (error) {
        console.error('Notes save error:', error);
        throw error;
      }

      console.log('✅ Notes saved successfully');
      setNotes(newNotes);
      return true;
    } catch (error) {
      console.error('❌ Error saving notes:', error);
      throw error;
    }
  };

  // FIXED: Save recurring reports with correct structure
  const saveRecurringReports = async (newReports) => {
    try {
      console.log('🚀 Saving recurring reports...');
      const organizationId = getOrganizationId();

      const supabaseReports = newReports.map(report => ({
        id: report.id || crypto.randomUUID(),
        recurring_id: report.recurringId,
        participant_id: report.participantId,
        month: report.month,
        completed_days: report.completedDays || [],
        values: report.values || {},
        organization_id: organizationId
      }));

      const { error } = await supabase
        .from('recurring_reports_coaching')
        .upsert(supabaseReports, { onConflict: 'id' });

      if (error) {
        console.error('Recurring reports save error:', error);
        throw error;
      }

      console.log('✅ Recurring reports saved successfully');
      setRecurringReports(newReports);
      return true;
    } catch (error) {
      console.error('❌ Error saving recurring reports:', error);
      throw error;
    }
  };

  // FIXED: Save meetings with correct structure
  const saveMeetings = async (newMeetings) => {
    try {
      console.log('🚀 Saving meetings...');
      const organizationId = getOrganizationId();

      const supabaseMeetings = newMeetings.map(meeting => ({
        id: meeting.id || crypto.randomUUID(),
        participant_id: meeting.participantId,
        coach_id: meeting.coachId,
        datum: meeting.datum,
        tijdstip: meeting.tijdstip,
        type: meeting.type,
        adres: meeting.adres || null,
        link: meeting.link || null,
        plan: meeting.plan || null,
        verslag: meeting.verslag || null,
        organization_id: organizationId
      }));

      const { error } = await supabase
        .from('meetings_coaching')
        .upsert(supabaseMeetings, { onConflict: 'id' });

      if (error) {
        console.error('Meetings save error:', error);
        throw error;
      }

      console.log('✅ Meetings saved successfully');
      setMeetings(newMeetings);
      return true;
    } catch (error) {
      console.error('❌ Error saving meetings:', error);
      throw error;
    }
  };

  const setEmailSettings = async (newEmailSettings) => {
    try {
      console.log('🚀 Saving email settings directly...');
      const organizationId = getOrganizationId();

      // Delete existing email settings for this organization
      if (organizationId) {
        await supabase
          .from('email_settings_coaching')
          .delete()
          .eq('organization_id', organizationId);
      }

      // Insert new email settings
      const supabaseEmailSettings = {
        id: crypto.randomUUID(),
        sender_email: newEmailSettings.senderEmail,
        sender_name: newEmailSettings.senderName,
        smtp_host: newEmailSettings.smtpHost || '',
        smtp_port: newEmailSettings.smtpPort || 587,
        username: newEmailSettings.username || '',
        password: newEmailSettings.password || '',
        use_tls: newEmailSettings.useTLS !== undefined ? newEmailSettings.useTLS : true,
        enabled: newEmailSettings.enabled || false,
        organization_id: organizationId
      };

      const { data, error } = await supabase
        .from('email_settings_coaching')
        .insert([supabaseEmailSettings])
        .select();

      if (error) {
        console.error('Email settings save error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Email settings saved successfully');
      setEmailSettingsState({ ...newEmailSettings, organizationId });
      return true;
    } catch (error) {
      console.error('❌ Error saving email settings:', error);
      throw error;
    }
  };

  const setThemeSettings = async (newThemeSettings) => {
    try {
      console.log('🚀 Saving theme settings directly...');
      const organizationId = getOrganizationId();

      // Delete existing theme settings for this organization
      if (organizationId) {
        await supabase
          .from('theme_settings_coaching')
          .delete()
          .eq('organization_id', organizationId);
      }

      // Insert new theme settings
      const supabaseThemeSettings = {
        id: crypto.randomUUID(),
        app_name: newThemeSettings.appName,
        logo_url: newThemeSettings.logoUrl,
        container_max_width: newThemeSettings.containerMaxWidth,
        use_max_width: newThemeSettings.useMaxWidth,
        background_color_outer: newThemeSettings.backgroundColorOuter,
        background_color_container: newThemeSettings.backgroundColorContainer,
        background_color_cards: newThemeSettings.backgroundColorCards,
        input_background_color: newThemeSettings.inputBackgroundColor,
        button_background_color: newThemeSettings.buttonBackgroundColor,
        button_hover_color: newThemeSettings.buttonHoverColor,
        button_text_color: newThemeSettings.buttonTextColor,
        header_background_color: newThemeSettings.headerBackgroundColor,
        primary_icon_color: newThemeSettings.primaryIconColor,
        secondary_icon_color: newThemeSettings.secondaryIconColor,
        organization_id: organizationId
      };

      const { data, error } = await supabase
        .from('theme_settings_coaching')
        .insert([supabaseThemeSettings])
        .select();

      if (error) {
        console.error('Theme settings save error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Theme settings saved successfully');
      setThemeSettingsState({ ...newThemeSettings, organizationId });
      return true;
    } catch (error) {
      console.error('❌ Error saving theme settings:', error);
      throw error;
    }
  };

  const setEmailLogs = async (newLogs) => {
    try {
      const organizationId = getOrganizationId();
      const supabaseLogs = newLogs.map(log => ({
        id: log.id || crypto.randomUUID(),
        timestamp: log.timestamp,
        type: log.type,
        to_email: log.to,
        subject: log.subject,
        success: log.success,
        error: log.error,
        message_id: log.messageId,
        organization_id: organizationId
      }));

      const { data, error } = await supabase
        .from('email_logs_coaching')
        .insert(supabaseLogs)
        .select();

      if (error) {
        console.error('Email logs save error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      setEmailLogsState(newLogs);
      return true;
    } catch (error) {
      console.error('❌ Error saving email logs:', error);
      throw error;
    }
  };

  // Fetch function with organization filtering and correct field mapping
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      console.log('Fetching data for organization:', organizationId);

      // Build queries with organization filtering
      const buildQuery = (baseQuery) => {
        return organizationId ? baseQuery.eq('organization_id', organizationId) : baseQuery;
      };

      // Fetch data with error handling
      const fetchWithErrorHandling = async (queryName, queryFunction) => {
        try {
          const { data, error } = await queryFunction();
          if (error && error.code !== 'PGRST116') {
            console.error(`Error fetching ${queryName}:`, error);
            return null;
          }
          return data;
        } catch (queryError) {
          console.error(`Query error for ${queryName}:`, queryError);
          return null;
        }
      };

      // Fetch all data
      const [
        usersData,
        assignmentsData,
        goalAgreementsData,
        recurringAgreementsData,
        reportsData,
        notesData,
        recurringReportsData,
        meetingsData,
        emailSettingsData,
        themeSettingsData,
        emailLogsData
      ] = await Promise.all([
        fetchWithErrorHandling('users', () => buildQuery(supabase.from('users_coaching').select('*'))),
        fetchWithErrorHandling('assignments', () => buildQuery(supabase.from('assignments_coaching').select('*'))),
        fetchWithErrorHandling('goalAgreements', () => buildQuery(supabase.from('goal_agreements_coaching').select('*'))),
        fetchWithErrorHandling('recurringAgreements', () => buildQuery(supabase.from('recurring_agreements_coaching').select('*'))),
        fetchWithErrorHandling('reports', () => buildQuery(supabase.from('reports_coaching').select('*'))),
        fetchWithErrorHandling('notes', () => buildQuery(supabase.from('notes_coaching').select('*'))),
        fetchWithErrorHandling('recurringReports', () => buildQuery(supabase.from('recurring_reports_coaching').select('*'))),
        fetchWithErrorHandling('meetings', () => buildQuery(supabase.from('meetings_coaching').select('*'))),
        fetchWithErrorHandling('emailSettings', () => 
          organizationId ? supabase.from('email_settings_coaching').select('*').eq('organization_id', organizationId).single() : Promise.resolve({ data: null })
        ),
        fetchWithErrorHandling('themeSettings', () => 
          organizationId ? supabase.from('theme_settings_coaching').select('*').eq('organization_id', organizationId).single() : Promise.resolve({ data: null })
        ),
        fetchWithErrorHandling('emailLogs', () => 
          buildQuery(supabase.from('email_logs_coaching').select('*')).order('timestamp', { ascending: false }).limit(50)
        )
      ]);

      // Transform and set data
      if (usersData) {
        const transformedUsers = usersData.map(user => ({
          id: user.id || '',
          nickname: user.nickname || '',
          password: user.password || '',
          voornaam: user.voornaam || '',
          achternaam: user.achternaam || '',
          emailadres: user.emailadres || '',
          mobiel: user.mobiel || '',
          geslacht: user.geslacht || '',
          leeftijd: user.geboortedatum ? calculateAge(user.geboortedatum) : (user.leeftijd || 0),
          geboortedatum: user.geboortedatum || '',
          foto: user.foto || '',
          role: user.role || 'participant',
          organizationId: user.organization_id || null
        }));
        setUsersState(transformedUsers);
      }

      if (assignmentsData) {
        const transformedAssignments = assignmentsData.map(assignment => ({
          id: assignment.id || '',
          coachId: assignment.coach_id || '',
          participantId: assignment.participant_id || '',
          organizationId: assignment.organization_id || null
        }));
        setAssignmentsState(transformedAssignments);
      }

      // FIXED: Transform goal agreements with correct field mapping
      if (goalAgreementsData) {
        const transformedGoals = goalAgreementsData.map(goal => ({
          id: goal.id || '',
          participantId: goal.participant_id || '',
          coachId: goal.coach_id || '',
          parentId: goal.parent_id || null,
          omschrijving: goal.omschrijving || '',
          streefdatum: goal.streefdatum || '',
          rapportagefrequentie: goal.rapportagefrequentie || '',
          status: goal.status || 'nog niet begonnen',
          consequentieVanToepassing: goal.consequentie_van_toepassing || 'nee',
          consequentie: goal.consequentie || '',
          organizationId: goal.organization_id || null
        }));
        setGoalAgreements(transformedGoals);
      }

      // FIXED: Transform recurring agreements with correct field mapping
      if (recurringAgreementsData) {
        const transformedRecurring = recurringAgreementsData.map(recurring => ({
          id: recurring.id || '',
          participantId: recurring.participant_id || '',
          coachId: recurring.coach_id || '',
          rubriek: recurring.rubriek || '',
          afspraakdoel: recurring.afspraakdoel || '',
          afspraakactie: recurring.afspraakactie || '',
          afspraaknotitie: recurring.afspraaknotitie || '',
          afspraakfrequentie: recurring.afspraakfrequentie || '',
          afspraakmethode: recurring.afspraakmethode || 'nee/ja',
          consequentieVanToepassing: recurring.consequentie_van_toepassing || 'nee',
          consequentie: recurring.consequentie || '',
          organizationId: recurring.organization_id || null
        }));
        setRecurringAgreements(transformedRecurring);
      }

      // FIXED: Transform reports with correct field mapping
      if (reportsData) {
        const transformedReports = reportsData.map(report => ({
          id: report.id || '',
          goalId: report.goal_id || '',
          participantId: report.participant_id || '',
          tekst: report.tekst || '',
          datum: report.datum || '',
          organizationId: report.organization_id || null
        }));
        setReports(transformedReports);
      }

      // FIXED: Transform notes with correct field mapping
      if (notesData) {
        const transformedNotes = notesData.map(note => ({
          id: note.id || '',
          userId: note.user_id || '',
          goalId: note.goal_id || null,
          recurringId: note.recurring_id || null,
          text: note.text || '',
          timestamp: note.timestamp || new Date().toISOString(),
          isCoachNote: note.is_coach_note || false,
          organizationId: note.organization_id || null
        }));
        setNotes(transformedNotes);
      }

      // FIXED: Transform recurring reports with correct field mapping
      if (recurringReportsData) {
        const transformedRecurringReports = recurringReportsData.map(report => ({
          id: report.id || '',
          recurringId: report.recurring_id || '',
          participantId: report.participant_id || '',
          month: report.month || '',
          completedDays: report.completed_days || [],
          values: report.values || {},
          organizationId: report.organization_id || null
        }));
        setRecurringReports(transformedRecurringReports);
      }

      // FIXED: Transform meetings with correct field mapping
      if (meetingsData) {
        const transformedMeetings = meetingsData.map(meeting => ({
          id: meeting.id || '',
          participantId: meeting.participant_id || '',
          coachId: meeting.coach_id || '',
          datum: meeting.datum || '',
          tijdstip: meeting.tijdstip || '',
          type: meeting.type || '',
          adres: meeting.adres || '',
          link: meeting.link || '',
          plan: meeting.plan || '',
          verslag: meeting.verslag || '',
          organizationId: meeting.organization_id || null
        }));
        setMeetings(transformedMeetings);
      }

      // Set email settings
      if (emailSettingsData) {
        setEmailSettingsState({
          senderEmail: emailSettingsData.sender_email || '',
          senderName: emailSettingsData.sender_name || '',
          smtpHost: emailSettingsData.smtp_host || '',
          smtpPort: emailSettingsData.smtp_port || 587,
          username: emailSettingsData.username || '',
          password: emailSettingsData.password || '',
          useTLS: emailSettingsData.use_tls !== undefined ? emailSettingsData.use_tls : true,
          enabled: emailSettingsData.enabled || false,
          organizationId: emailSettingsData.organization_id || null
        });
      }

      // Set theme settings
      if (themeSettingsData) {
        setThemeSettingsState({
          appName: themeSettingsData.app_name || 'Coaching App',
          logoUrl: themeSettingsData.logo_url || '',
          containerMaxWidth: themeSettingsData.container_max_width || '1290px',
          useMaxWidth: themeSettingsData.use_max_width !== undefined ? themeSettingsData.use_max_width : true,
          backgroundColorOuter: themeSettingsData.background_color_outer || '#8a1708',
          backgroundColorContainer: themeSettingsData.background_color_container || '#f7e6d9',
          backgroundColorCards: themeSettingsData.background_color_cards || '#edede6',
          inputBackgroundColor: themeSettingsData.input_background_color || '#ffffff',
          buttonBackgroundColor: themeSettingsData.button_background_color || '#33a370',
          buttonHoverColor: themeSettingsData.button_hover_color || '#8a1708',
          buttonTextColor: themeSettingsData.button_text_color || '#ffffff',
          headerBackgroundColor: themeSettingsData.header_background_color || '#edede6',
          primaryIconColor: themeSettingsData.primary_icon_color || '#3B82F6',
          secondaryIconColor: themeSettingsData.secondary_icon_color || '#6B7280',
          organizationId: themeSettingsData.organization_id || null
        });
      }

      // Set email logs
      if (emailLogsData) {
        const transformedLogs = emailLogsData.map(log => ({
          id: log.id || '',
          timestamp: log.timestamp || new Date().toISOString(),
          type: log.type || '',
          to: log.to_email || '',
          subject: log.subject || '',
          success: log.success || false,
          error: log.error || null,
          messageId: log.message_id || null,
          organizationId: log.organization_id || null
        }));
        setEmailLogsState(transformedLogs);
      }

      console.log('✅ Data fetched successfully');
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const value = {
    users,
    setUsers,
    assignments,
    setAssignments,
    goalAgreements,
    setGoalAgreements: saveGoalAgreements,
    recurringAgreements,
    setRecurringAgreements: saveRecurringAgreements,
    reports,
    setReports: saveReports,
    notes,
    setNotes: saveNotes,
    recurringReports,
    setRecurringReports: saveRecurringReports,
    meetings,
    setMeetings: saveMeetings,
    emailSettings,
    setEmailSettings,
    themeSettings,
    setThemeSettings,
    emailLogs,
    setEmailLogs,
    loading,
    refreshData: fetchAllData,
    resetDatabase
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};