-- Phase 1: Add last_active_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Phase 1: Add time_limit_minutes to quizzes
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT NULL;

-- Phase 1: Add question_type, image_url, points to quiz_questions
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'mcq';
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 1;

-- Phase 1: Add status, started_at, mcq_score, final_score, graded_at, timed_out to quiz_submissions
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'submitted';
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS mcq_score INTEGER DEFAULT 0;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS final_score INTEGER DEFAULT NULL;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quiz_submissions ADD COLUMN IF NOT EXISTS timed_out BOOLEAN DEFAULT FALSE;

-- Make score nullable (it will be computed)
ALTER TABLE quiz_submissions ALTER COLUMN score DROP NOT NULL;
ALTER TABLE quiz_submissions ALTER COLUMN score SET DEFAULT 0;

-- Phase 1: Create quiz_submission_answers table
CREATE TABLE IF NOT EXISTS quiz_submission_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_options(id) ON DELETE SET NULL,
  text_answer TEXT,
  is_correct BOOLEAN DEFAULT NULL,
  points_awarded INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(submission_id, question_id)
);

ALTER TABLE quiz_submission_answers ENABLE ROW LEVEL SECURITY;

-- RLS for quiz_submission_answers (using DO block to avoid errors if exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_submission_answers' AND policyname = 'Students can read own answers') THEN
    CREATE POLICY "Students can read own answers" ON quiz_submission_answers FOR SELECT USING (
      EXISTS (SELECT 1 FROM quiz_submissions WHERE quiz_submissions.id = quiz_submission_answers.submission_id AND quiz_submissions.student_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_submission_answers' AND policyname = 'Students can insert own answers') THEN
    CREATE POLICY "Students can insert own answers" ON quiz_submission_answers FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM quiz_submissions WHERE quiz_submissions.id = quiz_submission_answers.submission_id AND quiz_submissions.student_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_submission_answers' AND policyname = 'Students can update own answers') THEN
    CREATE POLICY "Students can update own answers" ON quiz_submission_answers FOR UPDATE USING (
      EXISTS (SELECT 1 FROM quiz_submissions WHERE quiz_submissions.id = quiz_submission_answers.submission_id AND quiz_submissions.student_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_submission_answers' AND policyname = 'Admins can manage all answers') THEN
    CREATE POLICY "Admins can manage all answers" ON quiz_submission_answers FOR ALL USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_submissions' AND policyname = 'Students can update own submissions') THEN
    CREATE POLICY "Students can update own submissions" ON quiz_submissions FOR UPDATE USING (auth.uid() = student_id);
  END IF;
END$$;

SELECT 'Schema migration complete!' as result;
