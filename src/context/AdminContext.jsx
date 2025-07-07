import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [globalThemeSettings, setGlobalThemeSettings] = useState({
    appName: 'Coaching Platform',
    logoUrl: '',
    backgroundColorOuter: '#8a1708',
    backgroundColorContainer: '#f7e6d9',
    backgroundColorCards: '#edede6',
    inputBackgroundColor: '#ffffff',
    buttonBackgroundColor: '#33a370',
    buttonHoverColor: '#8a1708',
    buttonTextColor: '#ffffff',
    headerBackgroundColor: '#edede6'
  });
  const [loading, setLoading] = useState(true);

  // Test database connection
  const testConnection = async () => {
    try {
      console.log('🔍 Testing Supabase connection...');
      const { data, error } = await supabase
        .from('organizations_admin')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Connection test failed:', error);
        return false;
      }

      console.log('✅ Connection test passed');
      return true;
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return false;
    }
  };

  // FIXED: Create database tables with proper schema
  const createDatabaseTables = async () => {
    try {
      console.log('🔧 Creating/updating database tables...');
      
      // Create organizations table with ALL required columns
      console.log('📋 Creating organizations_admin table...');
      const createOrganizationsQuery = `
        CREATE TABLE IF NOT EXISTS organizations_admin (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          domain TEXT NOT NULL,
          contact TEXT NOT NULL,
          plan TEXT NOT NULL DEFAULT 'Basic',
          status TEXT NOT NULL DEFAULT 'Actief',
          users INTEGER DEFAULT 0,
          coaches INTEGER DEFAULT 0,
          participants INTEGER DEFAULT 0,
          manager_name TEXT NOT NULL,
          manager_email TEXT NOT NULL UNIQUE,
          manager_password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      const { error: orgTableError } = await supabase.rpc('exec_sql', { 
        sql_query: createOrganizationsQuery 
      });

      if (orgTableError) {
        console.error('❌ Error creating organizations table:', orgTableError);
        // Try individual approach
        await createOrganizationsTableIndividually();
      } else {
        console.log('✅ Organizations table created successfully');
      }

      // Add missing columns if table exists but columns are missing
      console.log('📋 Adding missing columns to organizations_admin...');
      const addColumnsQueries = [
        `ALTER TABLE organizations_admin ADD COLUMN IF NOT EXISTS coaches INTEGER DEFAULT 0;`,
        `ALTER TABLE organizations_admin ADD COLUMN IF NOT EXISTS participants INTEGER DEFAULT 0;`,
        `ALTER TABLE organizations_admin ADD COLUMN IF NOT EXISTS users INTEGER DEFAULT 0;`
      ];

      for (const query of addColumnsQueries) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: query });
          if (error) {
            console.log('Column might already exist or other issue:', error.message);
          }
        } catch (err) {
          console.log('Error adding column:', err.message);
        }
      }

      // Create other admin tables
      console.log('📋 Creating other admin tables...');
      
      const createOtherTablesQuery = `
        -- Subscription plans table
        CREATE TABLE IF NOT EXISTS subscription_plans_admin (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          price_monthly DECIMAL(10,2) NOT NULL,
          price_yearly DECIMAL(10,2) NOT NULL,
          features JSONB NOT NULL DEFAULT '[]',
          popular BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Payments table
        CREATE TABLE IF NOT EXISTS payments_admin (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID REFERENCES organizations_admin(id),
          organization_name TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          status TEXT NOT NULL,
          date DATE NOT NULL,
          plan TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Global theme settings table
        CREATE TABLE IF NOT EXISTS global_theme_settings_admin (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          app_name TEXT DEFAULT 'Coaching Platform',
          logo_url TEXT,
          background_color_outer TEXT DEFAULT '#8a1708',
          background_color_container TEXT DEFAULT '#f7e6d9',
          background_color_cards TEXT DEFAULT '#edede6',
          input_background_color TEXT DEFAULT '#ffffff',
          button_background_color TEXT DEFAULT '#33a370',
          button_hover_color TEXT DEFAULT '#8a1708',
          button_text_color TEXT DEFAULT '#ffffff',
          header_background_color TEXT DEFAULT '#edede6',
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `;

      const { error: otherTablesError } = await supabase.rpc('exec_sql', { 
        sql_query: createOtherTablesQuery 
      });

      if (otherTablesError) {
        console.error('❌ Error creating other tables:', otherTablesError);
        await createOtherTablesIndividually();
      } else {
        console.log('✅ Other admin tables created successfully');
      }

      // Add organization_id to existing coaching tables
      console.log('📋 Adding organization_id to coaching tables...');
      const tables = [
        'users_coaching', 'assignments_coaching', 'goal_agreements_coaching',
        'recurring_agreements_coaching', 'reports_coaching', 'notes_coaching',
        'recurring_reports_coaching', 'meetings_coaching', 'email_settings_coaching',
        'theme_settings_coaching', 'email_logs_coaching'
      ];

      for (const table of tables) {
        try {
          const addOrgIdQuery = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS organization_id UUID;`;
          const { error } = await supabase.rpc('exec_sql', { sql_query: addOrgIdQuery });
          if (error) {
            console.log(`Column organization_id might already exist in ${table}:`, error.message);
          }
        } catch (colError) {
          console.log(`Error adding organization_id to ${table}:`, colError.message);
        }
      }

      // Enable RLS and create policies
      console.log('🔒 Setting up RLS and policies...');
      await setupRLSAndPolicies();

      console.log('✅ Database schema setup completed');
    } catch (error) {
      console.error('❌ Error in createDatabaseTables:', error);
      await createTablesIndividually();
    }
  };

  // Fallback: Create organizations table individually
  const createOrganizationsTableIndividually = async () => {
    try {
      console.log('🔧 Creating organizations table individually...');
      
      // First, create the basic table
      const { error: basicError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS organizations_admin (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            domain TEXT NOT NULL,
            contact TEXT NOT NULL,
            plan TEXT NOT NULL DEFAULT 'Basic',
            status TEXT NOT NULL DEFAULT 'Actief',
            manager_name TEXT NOT NULL,
            manager_email TEXT NOT NULL UNIQUE,
            manager_password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });

      if (basicError) {
        console.error('Error creating basic organizations table:', basicError);
      }

      // Then add the count columns
      const countColumns = [
        { name: 'users', type: 'INTEGER DEFAULT 0' },
        { name: 'coaches', type: 'INTEGER DEFAULT 0' },
        { name: 'participants', type: 'INTEGER DEFAULT 0' }
      ];

      for (const col of countColumns) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql_query: `ALTER TABLE organizations_admin ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`
          });
          if (error) {
            console.log(`Column ${col.name} might already exist:`, error.message);
          } else {
            console.log(`✅ Added column ${col.name} to organizations_admin`);
          }
        } catch (err) {
          console.log(`Error adding ${col.name} column:`, err.message);
        }
      }

      console.log('✅ Organizations table setup completed individually');
    } catch (error) {
      console.error('❌ Error in createOrganizationsTableIndividually:', error);
    }
  };

  // Fallback: Create other tables individually
  const createOtherTablesIndividually = async () => {
    try {
      console.log('🔧 Creating other admin tables individually...');

      const tables = [
        {
          name: 'subscription_plans_admin',
          sql: `
            CREATE TABLE IF NOT EXISTS subscription_plans_admin (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              price_monthly DECIMAL(10,2) NOT NULL,
              price_yearly DECIMAL(10,2) NOT NULL,
              features JSONB NOT NULL DEFAULT '[]',
              popular BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            );
          `
        },
        {
          name: 'payments_admin',
          sql: `
            CREATE TABLE IF NOT EXISTS payments_admin (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              organization_id UUID,
              organization_name TEXT NOT NULL,
              amount DECIMAL(10,2) NOT NULL,
              status TEXT NOT NULL,
              date DATE NOT NULL,
              plan TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT NOW()
            );
          `
        },
        {
          name: 'global_theme_settings_admin',
          sql: `
            CREATE TABLE IF NOT EXISTS global_theme_settings_admin (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              app_name TEXT DEFAULT 'Coaching Platform',
              logo_url TEXT,
              background_color_outer TEXT DEFAULT '#8a1708',
              background_color_container TEXT DEFAULT '#f7e6d9',
              background_color_cards TEXT DEFAULT '#edede6',
              input_background_color TEXT DEFAULT '#ffffff',
              button_background_color TEXT DEFAULT '#33a370',
              button_hover_color TEXT DEFAULT '#8a1708',
              button_text_color TEXT DEFAULT '#ffffff',
              header_background_color TEXT DEFAULT '#edede6',
              updated_at TIMESTAMP DEFAULT NOW()
            );
          `
        }
      ];

      for (const table of tables) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: table.sql });
          if (error) {
            console.error(`Error creating ${table.name}:`, error);
          } else {
            console.log(`✅ Created ${table.name}`);
          }
        } catch (err) {
          console.error(`Error with ${table.name}:`, err);
        }
      }

      console.log('✅ Other admin tables created individually');
    } catch (error) {
      console.error('❌ Error in createOtherTablesIndividually:', error);
    }
  };

  // Setup RLS and policies
  const setupRLSAndPolicies = async () => {
    try {
      console.log('🔒 Setting up RLS and policies...');

      const rlsAndPoliciesQuery = `
        -- Enable RLS
        ALTER TABLE organizations_admin ENABLE ROW LEVEL SECURITY;
        ALTER TABLE subscription_plans_admin ENABLE ROW LEVEL SECURITY;
        ALTER TABLE payments_admin ENABLE ROW LEVEL SECURITY;
        ALTER TABLE global_theme_settings_admin ENABLE ROW LEVEL SECURITY;

        -- Create policies for admin tables
        DROP POLICY IF EXISTS "Allow admin access to organizations" ON organizations_admin;
        CREATE POLICY "Allow admin access to organizations" ON organizations_admin FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow admin access to plans" ON subscription_plans_admin;
        CREATE POLICY "Allow admin access to plans" ON subscription_plans_admin FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow admin access to payments" ON payments_admin;
        CREATE POLICY "Allow admin access to payments" ON payments_admin FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow admin access to theme" ON global_theme_settings_admin;
        CREATE POLICY "Allow admin access to theme" ON global_theme_settings_admin FOR ALL USING (true);

        -- Organization-aware policies for coaching tables
        DROP POLICY IF EXISTS "Allow organization data access" ON users_coaching;
        CREATE POLICY "Allow organization data access" ON users_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON assignments_coaching;
        CREATE POLICY "Allow organization data access" ON assignments_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON goal_agreements_coaching;
        CREATE POLICY "Allow organization data access" ON goal_agreements_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON recurring_agreements_coaching;
        CREATE POLICY "Allow organization data access" ON recurring_agreements_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON reports_coaching;
        CREATE POLICY "Allow organization data access" ON reports_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON notes_coaching;
        CREATE POLICY "Allow organization data access" ON notes_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON recurring_reports_coaching;
        CREATE POLICY "Allow organization data access" ON recurring_reports_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON meetings_coaching;
        CREATE POLICY "Allow organization data access" ON meetings_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON email_settings_coaching;
        CREATE POLICY "Allow organization data access" ON email_settings_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON theme_settings_coaching;
        CREATE POLICY "Allow organization data access" ON theme_settings_coaching FOR ALL USING (true);

        DROP POLICY IF EXISTS "Allow organization data access" ON email_logs_coaching;
        CREATE POLICY "Allow organization data access" ON email_logs_coaching FOR ALL USING (true);
      `;

      const { error } = await supabase.rpc('exec_sql', { sql_query: rlsAndPoliciesQuery });
      if (error) {
        console.error('❌ Error setting up RLS and policies:', error);
      } else {
        console.log('✅ RLS and policies setup completed');
      }
    } catch (error) {
      console.error('❌ Error in setupRLSAndPolicies:', error);
    }
  };

  // Fallback method to create tables individually
  const createTablesIndividually = async () => {
    try {
      console.log('🔧 Creating tables individually (fallback)...');
      await createOrganizationsTableIndividually();
      await createOtherTablesIndividually();
      await setupRLSAndPolicies();
    } catch (error) {
      console.error('❌ Error creating tables individually:', error);
    }
  };

  // FIXED: Create theme settings for new organization based on current global theme
  const createOrganizationTheme = async (organizationId) => {
    try {
      console.log('🎨 Creating theme settings for organization:', organizationId);
      console.log('🎨 Using current global theme settings:', globalThemeSettings);
      
      // FIXED: Wait for global theme settings to be loaded first
      let themeToUse = globalThemeSettings;
      
      // If global theme settings are still default, try to fetch them from database
      if (globalThemeSettings.appName === 'Coaching Platform') {
        console.log('🎨 Fetching latest global theme settings from database...');
        try {
          const { data: latestTheme, error: themeError } = await supabase
            .from('global_theme_settings_admin')
            .select('*')
            .single();
          
          if (!themeError && latestTheme) {
            themeToUse = {
              appName: latestTheme.app_name || 'Coaching Platform',
              logoUrl: latestTheme.logo_url || '',
              backgroundColorOuter: latestTheme.background_color_outer || '#8a1708',
              backgroundColorContainer: latestTheme.background_color_container || '#f7e6d9',
              backgroundColorCards: latestTheme.background_color_cards || '#edede6',
              inputBackgroundColor: latestTheme.input_background_color || '#ffffff',
              buttonBackgroundColor: latestTheme.button_background_color || '#33a370',
              buttonHoverColor: latestTheme.button_hover_color || '#8a1708',
              buttonTextColor: latestTheme.button_text_color || '#ffffff',
              headerBackgroundColor: latestTheme.header_background_color || '#edede6'
            };
            console.log('🎨 Using latest global theme from database:', themeToUse);
          }
        } catch (fetchError) {
          console.log('🎨 Could not fetch latest global theme, using current state');
        }
      }
      
      const organizationThemeSettings = {
        organization_id: organizationId,
        app_name: themeToUse.appName,
        logo_url: themeToUse.logoUrl,
        container_max_width: '1290px',
        use_max_width: true,
        background_color_outer: themeToUse.backgroundColorOuter,
        background_color_container: themeToUse.backgroundColorContainer,
        background_color_cards: themeToUse.backgroundColorCards,
        input_background_color: themeToUse.inputBackgroundColor,
        button_background_color: themeToUse.buttonBackgroundColor,
        button_hover_color: themeToUse.buttonHoverColor,
        button_text_color: themeToUse.buttonTextColor,
        header_background_color: themeToUse.headerBackgroundColor,
        primary_icon_color: '#3B82F6',
        secondary_icon_color: '#6B7280'
      };

      console.log('🎨 Inserting theme settings for organization:', organizationThemeSettings);

      const { error } = await supabase
        .from('theme_settings_coaching')
        .insert([organizationThemeSettings]);

      if (error) {
        console.error('❌ Error creating organization theme:', error);
        throw error;
      } else {
        console.log('✅ Organization theme created successfully with global theme settings');
      }
    } catch (error) {
      console.error('❌ Error in createOrganizationTheme:', error);
      throw error;
    }
  };

  // FIXED: Update organization user counts
  const updateOrganizationUserCounts = async (organizationId) => {
    try {
      console.log('📊 Updating user counts for organization:', organizationId);

      // Get user counts from users_coaching table
      const { data: userData, error: userError } = await supabase
        .from('users_coaching')
        .select('role')
        .eq('organization_id', organizationId);

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      const coaches = userData.filter(u => u.role === 'coach').length;
      const participants = userData.filter(u => u.role === 'participant').length;
      const totalUsers = coaches + participants;

      console.log(`📊 Organization ${organizationId}: ${coaches} coaches, ${participants} participants, ${totalUsers} total`);

      // Update organization record
      const { error: updateError } = await supabase
        .from('organizations_admin')
        .update({
          users: totalUsers,
          coaches: coaches,
          participants: participants,
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (updateError) {
        console.error('Error updating organization counts:', updateError);
      } else {
        console.log('✅ Organization user counts updated successfully');
      }
    } catch (error) {
      console.error('❌ Error in updateOrganizationUserCounts:', error);
    }
  };

  // Fetch all admin data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      console.log('📊 Starting fetchAdminData...');

      // Test connection first
      const connected = await testConnection();
      if (!connected) {
        console.error('❌ Database connection failed');
        // Try to create tables
        await createDatabaseTables();
      }

      // Fetch global theme settings FIRST
      console.log('📋 Fetching global theme settings first...');
      try {
        const { data: themeData, error: themeError } = await supabase
          .from('global_theme_settings_admin')
          .select('*')
          .single();

        if (themeError) {
          console.error('Theme error:', themeError);
          await insertDefaultGlobalTheme();
        } else if (themeData) {
          const newThemeSettings = {
            appName: themeData.app_name || 'Coaching Platform',
            logoUrl: themeData.logo_url || '',
            backgroundColorOuter: themeData.background_color_outer || '#8a1708',
            backgroundColorContainer: themeData.background_color_container || '#f7e6d9',
            backgroundColorCards: themeData.background_color_cards || '#edede6',
            inputBackgroundColor: themeData.input_background_color || '#ffffff',
            buttonBackgroundColor: themeData.button_background_color || '#33a370',
            buttonHoverColor: themeData.button_hover_color || '#8a1708',
            buttonTextColor: themeData.button_text_color || '#ffffff',
            headerBackgroundColor: themeData.header_background_color || '#edede6'
          };
          
          console.log('✅ Global theme loaded FIRST:', newThemeSettings);
          setGlobalThemeSettings(newThemeSettings);
        }
      } catch (themeError) {
        console.error('❌ Theme fetch error:', themeError);
        await insertDefaultGlobalTheme();
      }

      // Fetch organizations
      console.log('📋 Fetching organizations...');
      try {
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations_admin')
          .select('*')
          .order('created_at', { ascending: true });

        if (orgsError) {
          console.error('Organizations error:', orgsError);
          await insertDefaultOrganizations();
        } else {
          const transformedOrgs = (orgsData || []).map(org => ({
            id: org.id,
            name: org.name,
            domain: org.domain,
            contact: org.contact,
            plan: org.plan,
            status: org.status,
            users: org.users || 0,
            coaches: org.coaches || 0,
            participants: org.participants || 0,
            managerName: org.manager_name,
            managerEmail: org.manager_email,
            managerPassword: org.manager_password,
            created: org.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
          }));
          
          console.log('✅ Organizations loaded:', transformedOrgs.length);
          setOrganizations(transformedOrgs);

          // Update user counts for all organizations
          for (const org of transformedOrgs) {
            await updateOrganizationUserCounts(org.id);
          }
        }
      } catch (orgError) {
        console.error('❌ Organizations fetch error:', orgError);
        await insertDefaultOrganizations();
      }

      // Fetch plans
      console.log('📋 Fetching plans...');
      try {
        const { data: plansData, error: plansError } = await supabase
          .from('subscription_plans_admin')
          .select('*')
          .order('price_monthly', { ascending: true });

        if (plansError) {
          console.error('Plans error:', plansError);
          await insertDefaultPlans();
        } else {
          const transformedPlans = (plansData || []).map(plan => ({
            id: plan.id,
            name: plan.name,
            priceMonthly: plan.price_monthly,
            priceYearly: plan.price_yearly,
            features: plan.features || [],
            popular: plan.popular
          }));
          
          console.log('✅ Plans loaded:', transformedPlans.length);
          setPlans(transformedPlans);
        }
      } catch (planError) {
        console.error('❌ Plans fetch error:', planError);
        await insertDefaultPlans();
      }

      // Fetch payments
      console.log('📋 Fetching payments...');
      try {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments_admin')
          .select('*')
          .order('date', { ascending: false });

        if (paymentsError) {
          console.error('Payments error:', paymentsError);
          setPayments([]);
        } else {
          const transformedPayments = (paymentsData || []).map(payment => ({
            id: payment.id,
            organization: payment.organization_name,
            amount: payment.amount,
            status: payment.status,
            date: payment.date,
            plan: payment.plan
          }));
          
          console.log('✅ Payments loaded:', transformedPayments.length);
          setPayments(transformedPayments);
        }
      } catch (paymentError) {
        console.error('❌ Payments fetch error:', paymentError);
        setPayments([]);
      }

      console.log('✅ fetchAdminData completed successfully');
    } catch (error) {
      console.error('❌ fetchAdminData general error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Insert default organizations
  const insertDefaultOrganizations = async () => {
    console.log('📝 Inserting default organizations...');
    const defaultOrganizations = [
      {
        name: 'Demo Coaching Organisatie',
        domain: 'demo.coaching-app.com',
        contact: 'info@demo.coaching-app.com',
        plan: 'Professional',
        users: 0,
        coaches: 0,
        participants: 0,
        manager_name: 'Demo Manager',
        manager_email: 'manager@demo.com',
        manager_password: 'Demo123!'
      }
    ];

    try {
      const { data, error } = await supabase
        .from('organizations_admin')
        .insert(defaultOrganizations)
        .select();

      if (error) {
        console.error('❌ Error inserting default organizations:', error);
      } else {
        console.log('✅ Default organizations inserted:', data);
        
        // Create theme settings for each new organization
        for (const org of data) {
          await createOrganizationTheme(org.id);
        }
        
        await fetchAdminData();
      }
    } catch (error) {
      console.error('❌ insertDefaultOrganizations error:', error);
    }
  };

  // Insert default plans
  const insertDefaultPlans = async () => {
    console.log('📝 Inserting default plans...');
    const defaultPlans = [
      {
        name: 'Starter',
        price_monthly: 19,
        price_yearly: 190,
        features: ['Tot 5 gebruikers', 'Basis coaching tools', 'E-mail ondersteuning', '2GB opslag'],
        popular: false
      },
      {
        name: 'Basic',
        price_monthly: 39,
        price_yearly: 390,
        features: ['Tot 15 gebruikers', 'Uitgebreide coaching tools', 'Chat ondersteuning', '10GB opslag'],
        popular: false
      },
      {
        name: 'Professional',
        price_monthly: 79,
        price_yearly: 790,
        features: ['Tot 50 gebruikers', 'Geavanceerde analytics', 'Priority ondersteuning', '100GB opslag', 'Custom branding'],
        popular: true
      }
    ];

    try {
      const { data, error } = await supabase
        .from('subscription_plans_admin')
        .insert(defaultPlans)
        .select();

      if (error) {
        console.error('❌ Error inserting default plans:', error);
      } else {
        console.log('✅ Default plans inserted:', data);
      }
    } catch (error) {
      console.error('❌ insertDefaultPlans error:', error);
    }
  };

  // Insert default global theme
  const insertDefaultGlobalTheme = async () => {
    console.log('📝 Inserting default global theme...');
    try {
      const { data, error } = await supabase
        .from('global_theme_settings_admin')
        .insert([{
          app_name: 'Coaching Platform',
          background_color_outer: '#8a1708',
          background_color_container: '#f7e6d9',
          background_color_cards: '#edede6',
          input_background_color: '#ffffff',
          button_background_color: '#33a370',
          button_hover_color: '#8a1708',
          button_text_color: '#ffffff',
          header_background_color: '#edede6'
        }])
        .select();

      if (error) {
        console.error('❌ Error inserting default global theme:', error);
      } else {
        console.log('✅ Default global theme inserted:', data);
        // Update local state immediately
        setGlobalThemeSettings({
          appName: 'Coaching Platform',
          logoUrl: '',
          backgroundColorOuter: '#8a1708',
          backgroundColorContainer: '#f7e6d9',
          backgroundColorCards: '#edede6',
          inputBackgroundColor: '#ffffff',
          buttonBackgroundColor: '#33a370',
          buttonHoverColor: '#8a1708',
          buttonTextColor: '#ffffff',
          headerBackgroundColor: '#edede6'
        });
      }
    } catch (error) {
      console.error('❌ insertDefaultGlobalTheme error:', error);
    }
  };

  // FIXED: Save organization with proper error handling
  const saveOrganization = async (orgData) => {
    try {
      console.log('💾 saveOrganization called with:', orgData);

      // Validate required fields
      if (!orgData.name || !orgData.domain || !orgData.contact) {
        throw new Error('Naam, domein en contact zijn verplicht');
      }

      if (!orgData.managerName || !orgData.managerEmail) {
        throw new Error('Manager naam en email zijn verplicht');
      }

      // FIXED: Ensure we only include columns that exist
      const supabaseData = {
        name: orgData.name,
        domain: orgData.domain,
        contact: orgData.contact,
        plan: orgData.plan,
        status: orgData.status || 'Actief',
        manager_name: orgData.managerName,
        manager_email: orgData.managerEmail,
        manager_password: orgData.managerPassword,
        updated_at: new Date().toISOString()
      };

      // Only add count columns if we're updating (they might not exist yet for new organizations)
      if (orgData.id && orgData.id.length > 10) {
        supabaseData.users = orgData.users || 0;
        supabaseData.coaches = orgData.coaches || 0;
        supabaseData.participants = orgData.participants || 0;
      }

      let result;
      if (orgData.id && orgData.id.length > 10) {
        // Update existing
        console.log('🔄 Updating organization with ID:', orgData.id);
        result = await supabase
          .from('organizations_admin')
          .update(supabaseData)
          .eq('id', orgData.id)
          .select();
      } else {
        // Insert new - start with basic data, then update counts
        console.log('➕ Inserting new organization');
        result = await supabase
          .from('organizations_admin')
          .insert([supabaseData])
          .select();
      }

      if (result.error) {
        console.error('❌ Supabase error details:', result.error);
        throw new Error(`Database error: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No data returned from save operation');
      }

      const savedOrg = result.data[0];
      console.log('✅ Organization saved successfully:', savedOrg);

      // For new organizations, now add the count columns and set them to 0
      if (!orgData.id || orgData.id.length <= 10) {
        console.log('📊 Setting initial counts for new organization...');
        try {
          const { error: updateError } = await supabase
            .from('organizations_admin')
            .update({
              users: 0,
              coaches: 0,
              participants: 0
            })
            .eq('id', savedOrg.id);
          
          if (updateError) {
            console.error('Error setting initial counts:', updateError);
          } else {
            console.log('✅ Initial counts set successfully');
          }
        } catch (countError) {
          console.error('Error updating counts:', countError);
        }

        // FIXED: Create theme settings for new organization using current global theme settings
        console.log('🎨 Creating theme settings for new organization...');
        try {
          await createOrganizationTheme(savedOrg.id);
        } catch (themeError) {
          console.error('❌ Error creating organization theme:', themeError);
          // Don't throw here, organization creation should still succeed
        }
      }

      // Update user counts
      await updateOrganizationUserCounts(savedOrg.id);

      // Refresh data
      await fetchAdminData();
      return true;
    } catch (error) {
      console.error('❌ saveOrganization error:', error);
      throw error;
    }
  };

  // Save subscription plan
  const saveSubscriptionPlan = async (planData) => {
    try {
      console.log('💾 saveSubscriptionPlan called with:', planData);

      if (!planData.name || !planData.priceMonthly || !planData.priceYearly) {
        throw new Error('Naam, maandprijs en jaarprijs zijn verplicht');
      }

      if (!planData.features || planData.features.length === 0) {
        throw new Error('Minimaal één feature is verplicht');
      }

      const supabaseData = {
        name: planData.name,
        price_monthly: parseFloat(planData.priceMonthly),
        price_yearly: parseFloat(planData.priceYearly),
        features: planData.features,
        popular: planData.popular || false,
        updated_at: new Date().toISOString()
      };

      let result;
      if (planData.id && planData.id.length > 10) {
        result = await supabase
          .from('subscription_plans_admin')
          .update(supabaseData)
          .eq('id', planData.id)
          .select();
      } else {
        result = await supabase
          .from('subscription_plans_admin')
          .insert([supabaseData])
          .select();
      }

      if (result.error) {
        throw new Error(`Database error: ${result.error.message}`);
      }

      await fetchAdminData();
      return true;
    } catch (error) {
      console.error('❌ saveSubscriptionPlan error:', error);
      throw error;
    }
  };

  // Save global theme settings
  const saveGlobalThemeSettings = async (themeData) => {
    try {
      console.log('💾 saveGlobalThemeSettings called with:', themeData);

      const supabaseData = {
        app_name: themeData.appName,
        logo_url: themeData.logoUrl,
        background_color_outer: themeData.backgroundColorOuter,
        background_color_container: themeData.backgroundColorContainer,
        background_color_cards: themeData.backgroundColorCards,
        input_background_color: themeData.inputBackgroundColor,
        button_background_color: themeData.buttonBackgroundColor,
        button_hover_color: themeData.buttonHoverColor,
        button_text_color: themeData.buttonTextColor,
        header_background_color: themeData.headerBackgroundColor,
        updated_at: new Date().toISOString()
      };

      // Try to get existing record first
      const { data: existingData, error: selectError } = await supabase
        .from('global_theme_settings_admin')
        .select('id')
        .limit(1);

      let result;
      if (existingData && existingData.length > 0) {
        result = await supabase
          .from('global_theme_settings_admin')
          .update(supabaseData)
          .eq('id', existingData[0].id)
          .select();
      } else {
        result = await supabase
          .from('global_theme_settings_admin')
          .insert([supabaseData])
          .select();
      }

      if (result.error) {
        throw new Error(`Database error: ${result.error.message}`);
      }

      // Update local state immediately
      setGlobalThemeSettings(themeData);
      console.log('✅ Global theme settings updated locally and in database:', themeData);
      
      return true;
    } catch (error) {
      console.error('❌ saveGlobalThemeSettings error:', error);
      throw error;
    }
  };

  // Delete organization
  const deleteOrganization = async (orgId) => {
    try {
      console.log('🗑️ Deleting organization with ID:', orgId);
      
      const { error } = await supabase
        .from('organizations_admin')
        .delete()
        .eq('id', orgId);

      if (error) {
        throw error;
      }

      await fetchAdminData();
      return true;
    } catch (error) {
      console.error('❌ deleteOrganization error:', error);
      throw error;
    }
  };

  // Delete subscription plan
  const deleteSubscriptionPlan = async (planId) => {
    try {
      console.log('🗑️ Deleting plan with ID:', planId);
      
      const { error } = await supabase
        .from('subscription_plans_admin')
        .delete()
        .eq('id', planId);

      if (error) {
        throw error;
      }

      await fetchAdminData();
      return true;
    } catch (error) {
      console.error('❌ deleteSubscriptionPlan error:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('🚀 AdminProvider mounting, starting fetchAdminData...');
    fetchAdminData();
  }, []);

  const value = {
    organizations,
    plans,
    payments,
    globalThemeSettings,
    loading,
    saveOrganization,
    saveSubscriptionPlan,
    saveGlobalThemeSettings,
    deleteOrganization,
    deleteSubscriptionPlan,
    refreshData: fetchAdminData,
    updateOrganizationUserCounts
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};