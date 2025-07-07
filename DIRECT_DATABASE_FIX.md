# 🔧 DIRECTE DATABASE FIX - Supabase Interface

## STAP 1: Ga naar Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Login met je account
3. Selecteer je project: `cnftsxilzkpzukpmzixm`

## STAP 2: Open SQL Editor
1. Klik op "SQL Editor" in het linker menu
2. Klik op "New query"

## STAP 3: Kopieer en plak deze SQL (ALLES TEGELIJK)

```sql
-- STAP 1: Verwijder alle bestaande tabellen
DROP TABLE IF EXISTS email_logs_coaching CASCADE;
DROP TABLE IF EXISTS theme_settings_coaching CASCADE;
DROP TABLE IF EXISTS email_settings_coaching CASCADE;
DROP TABLE IF EXISTS meetings_coaching CASCADE;
DROP TABLE IF EXISTS recurring_reports_coaching CASCADE;
DROP TABLE IF EXISTS notes_coaching CASCADE;
DROP TABLE IF EXISTS reports_coaching CASCADE;
DROP TABLE IF EXISTS recurring_agreements_coaching CASCADE;
DROP TABLE IF EXISTS goal_agreements_coaching CASCADE;
DROP TABLE IF EXISTS assignments_coaching CASCADE;
DROP TABLE IF EXISTS users_coaching CASCADE;

-- STAP 2: Maak users_coaching met organization_id
CREATE TABLE users_coaching (
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
);

-- STAP 3: Maak assignments_coaching
CREATE TABLE assignments_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID,
  participant_id UUID,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- STAP 4: Maak goal_agreements_coaching
CREATE TABLE goal_agreements_coaching (
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
);

-- STAP 5: Maak recurring_agreements_coaching
CREATE TABLE recurring_agreements_coaching (
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
);

-- STAP 6: Maak reports_coaching
CREATE TABLE reports_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID,
  participant_id UUID,
  tekst TEXT,
  datum DATE,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- STAP 7: Maak notes_coaching
CREATE TABLE notes_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  goal_id UUID,
  recurring_id UUID,
  text TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_coach_note BOOLEAN DEFAULT FALSE,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- STAP 8: Maak recurring_reports_coaching
CREATE TABLE recurring_reports_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id UUID,
  participant_id UUID,
  month TEXT,
  completed_days INTEGER[] DEFAULT '{}',
  values JSONB DEFAULT '{}',
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- STAP 9: Maak meetings_coaching
CREATE TABLE meetings_coaching (
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
);

-- STAP 10: Maak email_settings_coaching
CREATE TABLE email_settings_coaching (
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
);

-- STAP 11: Maak theme_settings_coaching
CREATE TABLE theme_settings_coaching (
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
);

-- STAP 12: Maak email_logs_coaching
CREATE TABLE email_logs_coaching (
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
);

-- STAP 13: Schakel RLS in
ALTER TABLE users_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_agreements_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_agreements_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_reports_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_settings_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs_coaching ENABLE ROW LEVEL SECURITY;

-- STAP 14: Maak simpele policies (ALLES TOESTAAN)
CREATE POLICY "Allow all operations" ON users_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON assignments_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON goal_agreements_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON recurring_agreements_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON reports_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON notes_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON recurring_reports_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON meetings_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON email_settings_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON theme_settings_coaching FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON email_logs_coaching FOR ALL USING (true);

-- STAP 15: Maak indexes voor performance
CREATE INDEX idx_users_coaching_org ON users_coaching(organization_id);
CREATE INDEX idx_assignments_coaching_org ON assignments_coaching(organization_id);
CREATE INDEX idx_goals_coaching_org ON goal_agreements_coaching(organization_id);
CREATE INDEX idx_recurring_coaching_org ON recurring_agreements_coaching(organization_id);
CREATE INDEX idx_reports_coaching_org ON reports_coaching(organization_id);
CREATE INDEX idx_notes_coaching_org ON notes_coaching(organization_id);
CREATE INDEX idx_recurring_reports_coaching_org ON recurring_reports_coaching(organization_id);
CREATE INDEX idx_meetings_coaching_org ON meetings_coaching(organization_id);
CREATE INDEX idx_email_settings_coaching_org ON email_settings_coaching(organization_id);
CREATE INDEX idx_theme_settings_coaching_org ON theme_settings_coaching(organization_id);
CREATE INDEX idx_email_logs_coaching_org ON email_logs_coaching(organization_id);
```

## STAP 4: Voer uit
1. Klik op "RUN" (groene knop rechtsonder)
2. Wacht tot alle queries zijn uitgevoerd
3. Check of er errors zijn - zo niet, SUCCESS! ✅

## STAP 5: Test
1. Ga terug naar je app
2. Refresh de pagina (F5)
3. Login als manager
4. Test gebruiker aanmaken
5. Test koppelingen
6. Test e-mail/thema instellingen

## Als dit werkt:
✅ Database is clean en correct opgezet
✅ Alle organization_id kolommen zijn aanwezig
✅ Geen legacy schema issues
✅ Simpele en werkende policies

## Als dit NIET werkt:
📧 Stuur me screenshots van:
1. De SQL Editor met eventuele error messages
2. Het resultaat van deze query in SQL Editor:
```sql
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name LIKE '%coaching' 
AND column_name = 'organization_id'
ORDER BY table_name;
```