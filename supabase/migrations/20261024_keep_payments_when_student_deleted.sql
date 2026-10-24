-- Keep money records (and therefore revenue) when a student is deleted.
-- Before: payment tables were ON DELETE CASCADE, so deleting a student erased what they paid.
-- After:  the rows stay, student_id becomes NULL, and the student's name is kept on the row.

-- 1) Snapshot column for the student's name
ALTER TABLE student_payments  ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE one_time_payments ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE private_sessions  ADD COLUMN IF NOT EXISTS student_name TEXT;

UPDATE student_payments  x SET student_name = COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = x.student_id AND x.student_name IS NULL;
UPDATE one_time_payments x SET student_name = COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = x.student_id AND x.student_name IS NULL;
UPDATE private_sessions  x SET student_name = COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = x.student_id AND x.student_name IS NULL;

-- 2) student_id may become NULL, and the foreign key no longer cascades
ALTER TABLE student_payments  ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE one_time_payments ALTER COLUMN student_id DROP NOT NULL;
ALTER TABLE private_sessions  ALTER COLUMN student_id DROP NOT NULL;

DO $$
DECLARE
  t TEXT;
  c TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['student_payments', 'one_time_payments', 'private_sessions'] LOOP
    FOR c IN
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
      WHERE rel.relname = t AND con.contype = 'f' AND att.attname = 'student_id'
    LOOP
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', t, c);
    END LOOP;
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE SET NULL',
      t, t || '_student_id_fkey'
    );
  END LOOP;
END$$;

-- 3) When a profile is deleted, stamp the student's name onto their money rows first
CREATE OR REPLACE FUNCTION snapshot_student_name_on_delete() RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_payments  SET student_name = COALESCE(student_name, OLD.full_name, OLD.email) WHERE student_id = OLD.id;
  UPDATE one_time_payments SET student_name = COALESCE(student_name, OLD.full_name, OLD.email) WHERE student_id = OLD.id;
  UPDATE private_sessions  SET student_name = COALESCE(student_name, OLD.full_name, OLD.email) WHERE student_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS snapshot_student_name_before_delete ON profiles;
CREATE TRIGGER snapshot_student_name_before_delete
  BEFORE DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION snapshot_student_name_on_delete();
