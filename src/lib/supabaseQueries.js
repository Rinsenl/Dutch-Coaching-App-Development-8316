// Supabase queries for admin data management
export const createAdminTables = `
-- Organizations table
CREATE TABLE IF NOT EXISTS organizations_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  contact TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'Basic',
  status TEXT NOT NULL DEFAULT 'Actief',
  users INTEGER DEFAULT 0,
  manager_name TEXT NOT NULL,
  manager_email TEXT NOT NULL UNIQUE,
  manager_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

-- Add organization_id to existing tables for multi-tenancy
ALTER TABLE users_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE assignments_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE goal_agreements_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE recurring_agreements_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE reports_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE notes_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE recurring_reports_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE meetings_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE email_settings_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE theme_settings_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);
ALTER TABLE email_logs_coaching ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations_admin(id);

-- Enable RLS
ALTER TABLE organizations_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_theme_settings_admin ENABLE ROW LEVEL SECURITY;

-- Update existing tables RLS to include organization_id
DROP POLICY IF EXISTS "Allow authenticated users to manage their own data" ON users_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage assignments" ON assignments_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage goals" ON goal_agreements_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage recurring" ON recurring_agreements_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage reports" ON reports_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage notes" ON notes_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage recurring reports" ON recurring_reports_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage meetings" ON meetings_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage email settings" ON email_settings_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage theme settings" ON theme_settings_coaching;
DROP POLICY IF EXISTS "Allow authenticated users to manage email logs" ON email_logs_coaching;

-- Create new organization-aware policies
CREATE POLICY "Allow organization data access" ON users_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON assignments_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON goal_agreements_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON recurring_agreements_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON reports_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON notes_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON recurring_reports_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON meetings_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON email_settings_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON theme_settings_coaching FOR ALL USING (true);
CREATE POLICY "Allow organization data access" ON email_logs_coaching FOR ALL USING (true);

-- Create policies for admin access
CREATE POLICY "Allow admin access to organizations" ON organizations_admin FOR ALL USING (true);
CREATE POLICY "Allow admin access to plans" ON subscription_plans_admin FOR ALL USING (true);
CREATE POLICY "Allow admin access to payments" ON payments_admin FOR ALL USING (true);
CREATE POLICY "Allow admin access to theme" ON global_theme_settings_admin FOR ALL USING (true);

-- Insert default plans
INSERT INTO subscription_plans_admin (name, price_monthly, price_yearly, features, popular) VALUES 
('Starter', 19, 190, '["Tot 5 gebruikers", "Basis coaching tools", "E-mail ondersteuning", "2GB opslag"]', false),
('Basic', 39, 390, '["Tot 15 gebruikers", "Uitgebreide coaching tools", "Chat ondersteuning", "10GB opslag"]', false),
('Professional', 79, 790, '["Tot 50 gebruikers", "Geavanceerde analytics", "Priority ondersteuning", "100GB opslag", "Custom branding"]', true),
('Business', 149, 1490, '["Tot 150 gebruikers", "AI coaching insights", "Dedicated support", "500GB opslag", "White-label oplossing"]', false),
('Enterprise', 299, 2990, '["Onbeperkte gebruikers", "Enterprise features", "24/7 support", "Onbeperkte opslag", "API toegang", "SSO integratie"]', false)
ON CONFLICT DO NOTHING;

-- Insert default organizations
INSERT INTO organizations_admin (name, domain, contact, plan, users, manager_name, manager_email, manager_password) VALUES 
('Coaching Organisatie 1', 'coaching1.example.com', 'info@coaching1.com', 'Professional', 25, 'Jan de Vries', 'manager@coaching1.com', 'Manager123!'),
('Health Coaching BV', 'health.example.com', 'admin@health.com', 'Basic', 12, 'Sarah Johnson', 'sarah@health.com', 'Health456!')
ON CONFLICT DO NOTHING;

-- Insert default payments
INSERT INTO payments_admin (organization_name, amount, status, date, plan) VALUES 
('Coaching Organisatie 1', 79.00, 'Betaald', '2024-01-15', 'Professional'),
('Health Coaching BV', 199.00, 'Openstaand', '2024-01-12', 'Enterprise')
ON CONFLICT DO NOTHING;

-- Insert default global theme
INSERT INTO global_theme_settings_admin (app_name) VALUES 
('Coaching Platform')
ON CONFLICT DO NOTHING;
`;