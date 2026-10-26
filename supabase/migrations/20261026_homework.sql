-- Homework: MCQ sets imported from JSON, auto-graded in the database.
-- The answer key lives in its own admin-only table, so students can never read it
-- before they submit. Grading happens in submit_homework() (SECURITY DEFINER).

CREATE TABLE IF NOT EXISTS homeworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,                                   -- e.g. "IT & AI textbook, Lesson 3-1"
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{ "question": "...", "options": ["...", ...] }]
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homework_keys (
  homework_id UUID PRIMARY KEY REFERENCES homeworks(id) ON DELETE CASCADE,
  answers JSONB NOT NULL                          -- [{ "correct_index": 1, "explanation": "..." }]
);

CREATE TABLE IF NOT EXISTS homework_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homework_id UUID NOT NULL REFERENCES homeworks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,                         -- selected option index per question (null = skipped)
  results JSONB NOT NULL,                         -- per-question result incl. correct answer + explanation
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS homework_submissions_hw_idx ON homework_submissions(homework_id);
CREATE INDEX IF NOT EXISTS homework_submissions_student_idx ON homework_submissions(student_id);

ALTER TABLE homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'homeworks' AND policyname = 'Students can read published homework') THEN
    CREATE POLICY "Students can read published homework" ON homeworks FOR SELECT USING (is_published = TRUE AND auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'homeworks' AND policyname = 'Admins can manage homework') THEN
    CREATE POLICY "Admins can manage homework" ON homeworks FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'homework_keys' AND policyname = 'Admins can manage homework keys') THEN
    CREATE POLICY "Admins can manage homework keys" ON homework_keys FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'homework_submissions' AND policyname = 'Students can read own homework submissions') THEN
    CREATE POLICY "Students can read own homework submissions" ON homework_submissions FOR SELECT USING (auth.uid() = student_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'homework_submissions' AND policyname = 'Admins can manage homework submissions') THEN
    CREATE POLICY "Admins can manage homework submissions" ON homework_submissions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END$$;

-- Grades a submission against the hidden key, stores it, and returns the result.
CREATE OR REPLACE FUNCTION submit_homework(p_homework_id UUID, p_answers JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k JSONB;
  total INTEGER;
  score INTEGER := 0;
  res JSONB := '[]'::jsonb;
  i INTEGER;
  sel INTEGER;
  corr INTEGER;
  ok BOOLEAN;
  sub_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM homeworks WHERE id = p_homework_id AND is_published = TRUE) AND NOT is_admin() THEN
    RAISE EXCEPTION 'Homework not available';
  END IF;

  SELECT answers INTO k FROM homework_keys WHERE homework_id = p_homework_id;
  IF k IS NULL THEN
    RAISE EXCEPTION 'Homework has no answer key';
  END IF;

  total := jsonb_array_length(k);
  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' THEN
    p_answers := '[]'::jsonb;
  END IF;

  FOR i IN 0..total - 1 LOOP
    corr := (k -> i ->> 'correct_index')::INTEGER;
    sel := NULLIF(p_answers ->> i, '')::INTEGER;
    ok := sel IS NOT NULL AND sel = corr;
    IF ok THEN score := score + 1; END IF;
    res := res || jsonb_build_array(jsonb_build_object(
      'selected', sel,
      'correct_index', corr,
      'is_correct', ok,
      'explanation', k -> i ->> 'explanation'
    ));
  END LOOP;

  INSERT INTO homework_submissions (homework_id, student_id, answers, results, score, total)
  VALUES (p_homework_id, auth.uid(), p_answers, res, score, total)
  RETURNING id INTO sub_id;

  RETURN jsonb_build_object('submission_id', sub_id, 'score', score, 'total', total, 'results', res);
END;
$$;

GRANT EXECUTE ON FUNCTION submit_homework(UUID, JSONB) TO authenticated;
