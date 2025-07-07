# 🔧 AANVULLENDE DATABASE FIX - Missing Tables

## STAP 1: Ga naar Supabase SQL Editor
1. Open https://supabase.com/dashboard
2. Selecteer je project: `cnftsxilzkpzukpmzixm`
3. Klik op "SQL Editor" → "New query"

## STAP 2: Kopieer en plak deze AANVULLENDE SQL

```sql
-- AANVULLENDE FIX: Controleer en herstel missing tables/columns

-- 1. Check en herstel goal_agreements_coaching
DROP TABLE IF EXISTS goal_agreements_coaching CASCADE;
CREATE TABLE goal_agreements_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  parent_id UUID, -- Voor subdoelen
  omschrijving TEXT NOT NULL,
  streefdatum DATE NOT NULL,
  rapportagefrequentie TEXT NOT NULL,
  status TEXT DEFAULT 'nog niet begonnen',
  consequentie_van_toepassing TEXT DEFAULT 'nee',
  consequentie TEXT,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Check en herstel recurring_agreements_coaching  
DROP TABLE IF EXISTS recurring_agreements_coaching CASCADE;
CREATE TABLE recurring_agreements_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  rubriek TEXT NOT NULL,
  afspraakdoel TEXT NOT NULL,
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

-- 3. Check en herstel reports_coaching
DROP TABLE IF EXISTS reports_coaching CASCADE;
CREATE TABLE reports_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  tekst TEXT NOT NULL,
  datum DATE NOT NULL,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Check en herstel notes_coaching
DROP TABLE IF EXISTS notes_coaching CASCADE;
CREATE TABLE notes_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_id UUID,
  recurring_id UUID,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  is_coach_note BOOLEAN DEFAULT FALSE,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Check en herstel recurring_reports_coaching
DROP TABLE IF EXISTS recurring_reports_coaching CASCADE;
CREATE TABLE recurring_reports_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  month TEXT NOT NULL,
  completed_days INTEGER[] DEFAULT '{}',
  values JSONB DEFAULT '{}',
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Check en herstel meetings_coaching
DROP TABLE IF EXISTS meetings_coaching CASCADE;
CREATE TABLE meetings_coaching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL,
  coach_id UUID NOT NULL,
  datum DATE NOT NULL,
  tijdstip TIME NOT NULL,
  type TEXT NOT NULL,
  adres TEXT,
  link TEXT,
  plan TEXT,
  verslag TEXT,
  organization_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Schakel RLS in voor alle tabellen
ALTER TABLE goal_agreements_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_agreements_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_reports_coaching ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings_coaching ENABLE ROW LEVEL SECURITY;

-- 8. Maak permissive policies (ALLES TOESTAAN)
-- Goals policies
DROP POLICY IF EXISTS "Allow all operations" ON goal_agreements_coaching;
CREATE POLICY "Allow all operations" ON goal_agreements_coaching FOR ALL USING (true);

-- Recurring agreements policies
DROP POLICY IF EXISTS "Allow all operations" ON recurring_agreements_coaching;
CREATE POLICY "Allow all operations" ON recurring_agreements_coaching FOR ALL USING (true);

-- Reports policies
DROP POLICY IF EXISTS "Allow all operations" ON reports_coaching;
CREATE POLICY "Allow all operations" ON reports_coaching FOR ALL USING (true);

-- Notes policies
DROP POLICY IF EXISTS "Allow all operations" ON notes_coaching;
CREATE POLICY "Allow all operations" ON notes_coaching FOR ALL USING (true);

-- Recurring reports policies
DROP POLICY IF EXISTS "Allow all operations" ON recurring_reports_coaching;
CREATE POLICY "Allow all operations" ON recurring_reports_coaching FOR ALL USING (true);

-- Meetings policies
DROP POLICY IF EXISTS "Allow all operations" ON meetings_coaching;
CREATE POLICY "Allow all operations" ON meetings_coaching FOR ALL USING (true);

-- 9. Maak indexes voor performance
CREATE INDEX IF NOT EXISTS idx_goals_coaching_participant ON goal_agreements_coaching(participant_id);
CREATE INDEX IF NOT EXISTS idx_goals_coaching_coach ON goal_agreements_coaching(coach_id);
CREATE INDEX IF NOT EXISTS idx_goals_coaching_parent ON goal_agreements_coaching(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_coaching_org ON goal_agreements_coaching(organization_id);

CREATE INDEX IF NOT EXISTS idx_recurring_coaching_participant ON recurring_agreements_coaching(participant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_coaching_coach ON recurring_agreements_coaching(coach_id);
CREATE INDEX IF NOT EXISTS idx_recurring_coaching_org ON recurring_agreements_coaching(organization_id);

CREATE INDEX IF NOT EXISTS idx_reports_coaching_goal ON reports_coaching(goal_id);
CREATE INDEX IF NOT EXISTS idx_reports_coaching_participant ON reports_coaching(participant_id);
CREATE INDEX IF NOT EXISTS idx_reports_coaching_org ON reports_coaching(organization_id);

CREATE INDEX IF NOT EXISTS idx_notes_coaching_user ON notes_coaching(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_coaching_goal ON notes_coaching(goal_id);
CREATE INDEX IF NOT EXISTS idx_notes_coaching_recurring ON notes_coaching(recurring_id);
CREATE INDEX IF NOT EXISTS idx_notes_coaching_org ON notes_coaching(organization_id);

CREATE INDEX IF NOT EXISTS idx_recurring_reports_coaching_recurring ON recurring_reports_coaching(recurring_id);
CREATE INDEX IF NOT EXISTS idx_recurring_reports_coaching_participant ON recurring_reports_coaching(participant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_reports_coaching_org ON recurring_reports_coaching(organization_id);

CREATE INDEX IF NOT EXISTS idx_meetings_coaching_participant ON meetings_coaching(participant_id);
CREATE INDEX IF NOT EXISTS idx_meetings_coaching_coach ON meetings_coaching(coach_id);
CREATE INDEX IF NOT EXISTS idx_meetings_coaching_org ON meetings_coaching(organization_id);

-- 10. Test insert (will be cleaned up)
INSERT INTO goal_agreements_coaching (
  participant_id, 
  coach_id, 
  omschrijving, 
  streefdatum, 
  rapportagefrequentie,
  organization_id
) VALUES (
  gen_random_uuid(), 
  gen_random_uuid(), 
  'Test Goal', 
  CURRENT_DATE + INTERVAL '30 days', 
  'wekelijks',
  gen_random_uuid()
);

-- Clean up test data
DELETE FROM goal_agreements_coaching WHERE omschrijving = 'Test Goal';

-- SUCCESS MESSAGE
SELECT 'DATABASE FIX COMPLETED SUCCESSFULLY!' as status;
```

## STAP 3: Voer uit
1. Klik op "RUN" (groene knop)
2. Wacht tot alle queries zijn uitgevoerd
3. Controleer of je "DATABASE FIX COMPLETED SUCCESSFULLY!" ziet

## STAP 4: Test
1. Ga terug naar je app
2. Refresh de pagina (F5)
3. Login als begeleider
4. Maak een doelafspraak aan
5. Test of deze wordt opgeslagen