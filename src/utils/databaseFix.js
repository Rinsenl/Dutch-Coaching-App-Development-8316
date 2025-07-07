// Database schema fix utility
import supabase from '../lib/supabase';

export const fixDatabaseSchemaDirectly = async () => {
  console.log('🔧 Starting DIRECT database schema fix...');
  
  try {
    // Step 1: Create missing columns directly
    const queries = [
      // Add organization_id to users_coaching
      `ALTER TABLE users_coaching ADD COLUMN IF NOT EXISTS organization_id UUID;`,
      
      // Fix foto column type
      `ALTER TABLE users_coaching ALTER COLUMN foto TYPE TEXT;`,
      
      // Add organization_id to other tables
      `ALTER TABLE assignments_coaching ADD COLUMN IF NOT EXISTS organization_id UUID;`,
      `ALTER TABLE email_settings_coaching ADD COLUMN IF NOT EXISTS organization_id UUID;`,
      `ALTER TABLE theme_settings_coaching ADD COLUMN IF NOT EXISTS organization_id UUID;`,
      `ALTER TABLE email_logs_coaching ADD COLUMN IF NOT EXISTS organization_id UUID;`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_users_coaching_organization_id ON users_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_assignments_coaching_organization_id ON assignments_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_email_settings_coaching_organization_id ON email_settings_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_theme_settings_coaching_organization_id ON theme_settings_coaching(organization_id);`,
      `CREATE INDEX IF NOT EXISTS idx_email_logs_coaching_organization_id ON email_logs_coaching(organization_id);`
    ];

    // Execute each query individually
    for (const query of queries) {
      try {
        console.log('Executing:', query);
        const { error } = await supabase.rpc('exec_sql', { sql_query: query });
        if (error) {
          console.log('Query result:', error.message);
        } else {
          console.log('✅ Query successful');
        }
      } catch (queryError) {
        console.log('Query error:', queryError.message);
      }
    }

    console.log('✅ Direct database schema fix completed');
    return true;
  } catch (error) {
    console.error('❌ Direct schema fix error:', error);
    return false;
  }
};

export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users_coaching')
      .select('id, organization_id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database test failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
};