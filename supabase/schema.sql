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
