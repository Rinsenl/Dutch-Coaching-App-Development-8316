// Complete database reset and rebuild utility
import supabase from '../lib/supabase';

export const completeResetAndRebuild = async () => {
  console.log('🔥 Starting COMPLETE database reset and rebuild...');
  
  try {
    // Step 1: Drop and recreate ALL tables with proper schema
    const dropAndCreateQueries = [
      // Drop existing tables
      `DROP TABLE IF EXISTS email_logs_coaching CASCADE;`,
      `DROP TABLE IF EXISTS theme_settings_coaching CASCADE;`,
      `DROP TABLE IF EXISTS email_settings_coaching CASCADE;`,
      `DROP TABLE IF EXISTS meetings_coaching CASCADE;`,
      `DROP TABLE IF EXISTS recurring_reports_coaching CASCADE;`,
      `DROP TABLE IF EXISTS notes_coaching CASCADE;`,
      `DROP TABLE IF EXISTS reports_coaching CASCADE;`,
      `DROP TABLE IF EXISTS recurring_agreements_coaching CASCADE;`,
      `DROP TABLE IF EXISTS goal_agreements_coaching CASCADE;`,
      `DROP TABLE IF EXISTS assignments_coaching CASCADE;`,
      `DROP TABLE IF EXISTS users_coaching CASCADE;`,
      
      // Recreate users_coaching with organization_id from the start
      `CREATE TABLE users_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nickname TEXT NOT NULL,
        password TEXT NOT NULL,
        voornaam TEXT,
        achternaam TEXT,
        emailadres TEXT,
        mobiel TEXT,
        geslacht TEXT,
        leeftijd INTEGER DEFAULT 0,
        geboortedatum DATE,
        foto TEXT,
        role TEXT DEFAULT 'participant',
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate assignments_coaching
      `CREATE TABLE assignments_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        coach_id UUID,
        participant_id UUID,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate goal_agreements_coaching
      `CREATE TABLE goal_agreements_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID,
        coach_id UUID,
        parent_id UUID,
        omschrijving TEXT,
        streefdatum DATE,
        rapportagefrequentie TEXT,
        status TEXT DEFAULT 'nog niet begonnen',
        consequentie_van_toepassing TEXT DEFAULT 'nee',
        consequentie TEXT,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate recurring_agreements_coaching
      `CREATE TABLE recurring_agreements_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID,
        coach_id UUID,
        rubriek TEXT,
        afspraakdoel TEXT,
        afspraakactie TEXT,
        afspraaknotitie TEXT,
        afspraakfrequentie TEXT,
        afspraakmethode TEXT DEFAULT 'nee/ja',
        consequentie_van_toepassing TEXT DEFAULT 'nee',
        consequentie TEXT,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate reports_coaching
      `CREATE TABLE reports_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        goal_id UUID,
        participant_id UUID,
        tekst TEXT,
        datum DATE,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate notes_coaching
      `CREATE TABLE notes_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        goal_id UUID,
        recurring_id UUID,
        text TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        is_coach_note BOOLEAN DEFAULT FALSE,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate recurring_reports_coaching
      `CREATE TABLE recurring_reports_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recurring_id UUID,
        participant_id UUID,
        month TEXT,
        completed_days INTEGER[] DEFAULT '{}',
        values JSONB DEFAULT '{}',
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate meetings_coaching
      `CREATE TABLE meetings_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id UUID,
        coach_id UUID,
        datum DATE,
        tijdstip TIME,
        type TEXT,
        adres TEXT,
        link TEXT,
        plan TEXT,
        verslag TEXT,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate email_settings_coaching
      `CREATE TABLE email_settings_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_email TEXT,
        sender_name TEXT,
        smtp_host TEXT,
        smtp_port INTEGER DEFAULT 587,
        username TEXT,
        password TEXT,
        use_tls BOOLEAN DEFAULT TRUE,
        enabled BOOLEAN DEFAULT FALSE,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate theme_settings_coaching
      `CREATE TABLE theme_settings_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_name TEXT DEFAULT 'Coaching App',
        logo_url TEXT,
        container_max_width TEXT DEFAULT '1290px',
        use_max_width BOOLEAN DEFAULT TRUE,
        background_color_outer TEXT DEFAULT '#8a1708',
        background_color_container TEXT DEFAULT '#f7e6d9',
        background_color_cards TEXT DEFAULT '#edede6',
        input_background_color TEXT DEFAULT '#ffffff',
        button_background_color TEXT DEFAULT '#33a370',
        button_hover_color TEXT DEFAULT '#8a1708',
        button_text_color TEXT DEFAULT '#ffffff',
        header_background_color TEXT DEFAULT '#edede6',
        primary_icon_color TEXT DEFAULT '#3B82F6',
        secondary_icon_color TEXT DEFAULT '#6B7280',
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      
      // Recreate email_logs_coaching
      `CREATE TABLE email_logs_coaching (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp TIMESTAMP DEFAULT NOW(),
        type TEXT,
        to_email TEXT,
        subject TEXT,
        success BOOLEAN DEFAULT FALSE,
        error TEXT,
        message_id TEXT,
        organization_id UUID,
        created_at TIMESTAMP DEFAULT NOW()
      );`
    ];

    // Execute table recreation
    for (const query of dropAndCreateQueries) {
      try {
        console.log('Executing:', query.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        if (error) {
          console.error('Query error:', error);
          throw error;
        }
        console.log('✅ Query successful');
      } catch (queryError) {
        console.error('Failed query:', queryError);
        throw queryError;
      }
    }

    // Step 2: Enable RLS on all tables
    const rlsQueries = [
      `ALTER TABLE users_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE assignments_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE goal_agreements_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE recurring_agreements_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE reports_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE notes_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE recurring_reports_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE meetings_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE email_settings_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE theme_settings_coaching ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE email_logs_coaching ENABLE ROW LEVEL SECURITY;`
    ];

    for (const query of rlsQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        if (error) console.log('RLS error (might already exist):', error.message);
      } catch (e) {
        console.log('RLS error:', e.message);
      }
    }

    // Step 3: Create simple policies that allow all operations
    const policyQueries = [
      // Users policies
      `DROP POLICY IF EXISTS "Allow all users operations" ON users_coaching;`,
      `CREATE POLICY "Allow all users operations" ON users_coaching FOR ALL USING (true);`,
      
      // Assignments policies
      `DROP POLICY IF EXISTS "Allow all assignments operations" ON assignments_coaching;`,
      `CREATE POLICY "Allow all assignments operations" ON assignments_coaching FOR ALL USING (true);`,
      
      // Goal agreements policies
      `DROP POLICY IF EXISTS "Allow all goals operations" ON goal_agreements_coaching;`,
      `CREATE POLICY "Allow all goals operations" ON goal_agreements_coaching FOR ALL USING (true);`,
      
      // Recurring agreements policies
      `DROP POLICY IF EXISTS "Allow all recurring operations" ON recurring_agreements_coaching;`,
      `CREATE POLICY "Allow all recurring operations" ON recurring_agreements_coaching FOR ALL USING (true);`,
      
      // Reports policies
      `DROP POLICY IF EXISTS "Allow all reports operations" ON reports_coaching;`,
      `CREATE POLICY "Allow all reports operations" ON reports_coaching FOR ALL USING (true);`,
      
      // Notes policies
      `DROP POLICY IF EXISTS "Allow all notes operations" ON notes_coaching;`,
      `CREATE POLICY "Allow all notes operations" ON notes_coaching FOR ALL USING (true);`,
      
      // Recurring reports policies
      `DROP POLICY IF EXISTS "Allow all recurring reports operations" ON recurring_reports_coaching;`,
      `CREATE POLICY "Allow all recurring reports operations" ON recurring_reports_coaching FOR ALL USING (true);`,
      
      // Meetings policies
      `DROP POLICY IF EXISTS "Allow all meetings operations" ON meetings_coaching;`,
      `CREATE POLICY "Allow all meetings operations" ON meetings_coaching FOR ALL USING (true);`,
      
      // Email settings policies
      `DROP POLICY IF EXISTS "Allow all email settings operations" ON email_settings_coaching;`,
      `CREATE POLICY "Allow all email settings operations" ON email_settings_coaching FOR ALL USING (true);`,
      
      // Theme settings policies
      `DROP POLICY IF EXISTS "Allow all theme settings operations" ON theme_settings_coaching;`,
      `CREATE POLICY "Allow all theme settings operations" ON theme_settings_coaching FOR ALL USING (true);`,
      
      // Email logs policies
      `DROP POLICY IF EXISTS "Allow all email logs operations" ON email_logs_coaching;`,
      `CREATE POLICY "Allow all email logs operations" ON email_logs_coaching FOR ALL USING (true);`
    ];

    for (const query of policyQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        if (error) console.log('Policy error:', error.message);
      } catch (e) {
        console.log('Policy error:', e.message);
      }
    }

    // Step 4: Create indexes for performance
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_users_coaching_org ON users_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_coaching_org ON assignments_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_goals_coaching_org ON goal_agreements_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_recurring_coaching_org ON recurring_agreements_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_reports_coaching_org ON reports_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_coaching_org ON notes_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_recurring_reports_coaching_org ON recurring_reports_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_meetings_coaching_org ON meetings_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_email_settings_coaching_org ON email_settings_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_theme_settings_coaching_org ON theme_settings_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_email_logs_coaching_org ON email_logs_coaching(organization_id);`
    ];

    for (const query of indexQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        if (error) console.log('Index error:', error.message);
      } catch (e) {
        console.log('Index error:', e.message);
      }
    }

    console.log('✅ Complete database reset and rebuild completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Complete reset failed:', error);
    return false;
  }
};

export const testNewSchema = async () => {
  try {
    console.log('🔍 Testing new schema...');
    
    // Test if we can insert into users_coaching with organization_id
    const testUser = {
      id: 'test-user-123',
      nickname: 'test',
      password: 'test123',
      voornaam: 'Test',
      achternaam: 'User',
      role: 'participant',
      organization_id: 'test-org-456'
    };
    
    const { data, error } = await supabase
      .from('users_coaching')
      .insert([testUser])
      .select();
    
    if (error) {
      console.error('Schema test failed:', error);
      return false;
    }
    
    // Clean up test data
    await supabase
      .from('users_coaching')
      .delete()
      .eq('id', 'test-user-123');
    
    console.log('✅ Schema test passed');
    return true;
  } catch (error) {
    console.error('❌ Schema test error:', error);
    return false;
  }
};