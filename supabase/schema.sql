-- Users & Profiles (Extending Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student', -- 'student' or 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Core Learning Data
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- Markdown or rich text
  video_provider TEXT, -- e.g., 'google_drive', 'bunny'
  video_id TEXT,
  video_url TEXT,
  pdf_url TEXT,
  order_index INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access & Progress
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  watched_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(student_id, lesson_id)
);

-- Row Level Security (RLS)

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, Admins can read all.
CREATE POLICY "Anyone authenticated can read profiles" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses: Everyone can read published courses.
CREATE POLICY "Anyone can read published courses" ON courses FOR SELECT USING (is_published = TRUE);

-- Units & Lessons: Everyone can read units and lessons for published courses.
CREATE POLICY "Anyone can read units for published courses" ON units FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = units.course_id AND courses.is_published = TRUE)
);

CREATE POLICY "Anyone can read lessons for published courses" ON lessons FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM units 
    JOIN courses ON courses.id = units.course_id 
    WHERE units.id = lessons.unit_id AND courses.is_published = TRUE
  )
);

-- Enrollments: Students can read their own enrollments.
CREATE POLICY "Students can read own enrollments" ON enrollments FOR SELECT USING (auth.uid() = student_id);

-- Lesson Progress: Students can read and update their own progress.
CREATE POLICY "Students can read own progress" ON lesson_progress FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own progress" ON lesson_progress FOR UPDATE USING (auth.uid() = student_id);

-- Trigger to automatically create a profile when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Quizzes & Assignments
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  show_grade_immediately BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quiz_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quiz_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id, student_id)
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Quizzes RLS
CREATE POLICY "Anyone can read quizzes for published courses" ON quizzes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM units 
    JOIN courses ON courses.id = units.course_id 
    WHERE units.id = quizzes.unit_id AND courses.is_published = TRUE
  )
);

CREATE POLICY "Anyone can read questions for published quizzes" ON quiz_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    JOIN units ON units.id = quizzes.unit_id
    JOIN courses ON courses.id = units.course_id 
    WHERE quizzes.id = quiz_questions.quiz_id AND courses.is_published = TRUE
  )
);

CREATE POLICY "Anyone can read options for published questions" ON quiz_options FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quiz_questions 
    JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
    JOIN units ON units.id = quizzes.unit_id
    JOIN courses ON courses.id = units.course_id 
    WHERE quiz_questions.id = quiz_options.question_id AND courses.is_published = TRUE
  )
);

CREATE POLICY "Students can read own submissions" ON quiz_submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own submissions" ON quiz_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage units" ON units FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage enrollments" ON enrollments FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage quizzes" ON quizzes FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage quiz questions" ON quiz_questions FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage quiz options" ON quiz_options FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage quiz submissions" ON quiz_submissions FOR ALL USING (is_admin());
CREATE POLICY "Students can insert own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing users
UPDATE profiles SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id);

-- Monthly Student Payments
CREATE TABLE IF NOT EXISTS student_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'pending')),
  amount NUMERIC(10, 2) DEFAULT 0,
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, month, year)
);

ALTER TABLE student_payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_payments' AND policyname = 'Admins can manage all student payments') THEN
    CREATE POLICY "Admins can manage all student payments" ON student_payments FOR ALL USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_payments' AND policyname = 'Students can read own payments') THEN
    CREATE POLICY "Students can read own payments" ON student_payments FOR SELECT USING (auth.uid() = student_id);
  END IF;
END$$;

-- One-time fees, private sessions, monthly exemptions (see migrations/20261018_one_time_fees_and_private_sessions.sql)
-- 1) One-time fees
CREATE TABLE IF NOT EXISTS one_time_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('notes', 'printing', 'other')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS one_time_payments_student_idx ON one_time_payments(student_id);

-- 2) Private sessions: one row per session (a "bulk" add of 3 sessions creates 3 rows)
CREATE TABLE IF NOT EXISTS private_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid')),
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS private_sessions_student_idx ON private_sessions(student_id);

-- 3) Students who only take private sessions (hidden from the monthly tuition list/stats)
CREATE TABLE IF NOT EXISTS monthly_exemptions (
  student_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE one_time_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_exemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'one_time_payments' AND policyname = 'Admins can manage one time payments') THEN
    CREATE POLICY "Admins can manage one time payments" ON one_time_payments FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'private_sessions' AND policyname = 'Admins can manage private sessions') THEN
    CREATE POLICY "Admins can manage private sessions" ON private_sessions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_exemptions' AND policyname = 'Admins can manage monthly exemptions') THEN
    CREATE POLICY "Admins can manage monthly exemptions" ON monthly_exemptions FOR ALL USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END$$;

-- Homework (see migrations/20261026_homework.sql)
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
