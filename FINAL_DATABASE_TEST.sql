-- 🔍 FINALE DATABASE TEST EN DEBUG
-- Kopieer deze SQL in Supabase SQL Editor en RUN

-- STAP 1: Controleer of tabellen bestaan
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Bestaat'
    ELSE '❌ Ontbreekt'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'goal_agreements_coaching',
    'recurring_agreements_coaching',
    'reports_coaching',
    'notes_coaching',
    'recurring_reports_coaching',
    'meetings_coaching'
  )
ORDER BY table_name;

-- STAP 2: Controleer kolommen van goal_agreements_coaching
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'goal_agreements_coaching' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STAP 3: Controleer kolommen van recurring_agreements_coaching  
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'recurring_agreements_coaching' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STAP 4: Test INSERT in goal_agreements_coaching
INSERT INTO goal_agreements_coaching (
  participant_id,
  coach_id,
  omschrijving,
  streefdatum,
  rapportagefrequentie,
  status,
  organization_id
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'TEST DOEL - Database Test',
  CURRENT_DATE + INTERVAL '30 days',
  'wekelijks',
  'nog niet begonnen',
  gen_random_uuid()
) RETURNING *;

-- STAP 5: Test INSERT in recurring_agreements_coaching
INSERT INTO recurring_agreements_coaching (
  participant_id,
  coach_id,
  rubriek,
  afspraakdoel,
  afspraakactie,
  organization_id
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'TEST RUBRIEK - Database Test',
  'TEST DOEL - Database Test',
  'TEST ACTIE - Database Test',
  gen_random_uuid()
) RETURNING *;

-- STAP 6: Laat test data zien
SELECT 
  'goal_agreements_coaching' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_created
FROM goal_agreements_coaching
WHERE omschrijving LIKE 'TEST DOEL%'

UNION ALL

SELECT 
  'recurring_agreements_coaching' as table_name,
  COUNT(*) as record_count,
  MAX(created_at) as last_created
FROM recurring_agreements_coaching
WHERE rubriek LIKE 'TEST RUBRIEK%';

-- STAP 7: Controleer RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN (
  'goal_agreements_coaching',
  'recurring_agreements_coaching'
)
ORDER BY tablename, policyname;

-- STAP 8: Clean up test data
DELETE FROM goal_agreements_coaching 
WHERE omschrijving LIKE 'TEST DOEL%';

DELETE FROM recurring_agreements_coaching 
WHERE rubriek LIKE 'TEST RUBRIEK%';

-- RESULTAAT VERWACHTING:
SELECT 'DATABASE TEST VOLTOOID!' as status,
       'Controleer de resultaten hierboven' as instructie;