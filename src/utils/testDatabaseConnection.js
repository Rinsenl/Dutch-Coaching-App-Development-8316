// Simple database connection test
import supabase from '../lib/supabase';

export const testDatabaseAfterReset = async () => {
  console.log('🔍 Testing database after manual reset...');
  
  try {
    // Test 1: Check if tables exist with organization_id
    console.log('Testing table structure...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('users_coaching')
      .select('id, organization_id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return false;
    }
    
    console.log('✅ Tables exist and have organization_id column');
    
    // Test 2: Try to insert a test user
    console.log('Testing insert operation...');
    const testUser = {
      id: 'test-user-' + Date.now(),
      nickname: 'testuser',
      password: 'test123',
      voornaam: 'Test',
      achternaam: 'User',
      role: 'participant',
      organization_id: 'test-org-123'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users_coaching')
      .insert([testUser])
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return false;
    }
    
    console.log('✅ Insert operation successful');
    
    // Test 3: Clean up test data
    await supabase
      .from('users_coaching')
      .delete()
      .eq('id', testUser.id);
    
    console.log('✅ Database is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
};

export const checkAllTablesStructure = async () => {
  console.log('🔍 Checking all table structures...');
  
  const tables = [
    'users_coaching',
    'assignments_coaching', 
    'goal_agreements_coaching',
    'recurring_agreements_coaching',
    'reports_coaching',
    'notes_coaching',
    'recurring_reports_coaching',
    'meetings_coaching',
    'email_settings_coaching',
    'theme_settings_coaching',
    'email_logs_coaching'
  ];
  
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (error) {
        results[table] = `❌ Error: ${error.message}`;
      } else {
        results[table] = `✅ OK`;
      }
    } catch (err) {
      results[table] = `❌ Exception: ${err.message}`;
    }
  }
  
  console.log('Table structure check results:', results);
  return results;
};