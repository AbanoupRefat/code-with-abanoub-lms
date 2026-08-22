CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('quiz', 'lecture', 'assignment', 'holiday', 'other')),
  event_date TIMESTAMPTZ NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users on calendar_events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (true);

-- Allow all access to service role (admin actions)
CREATE POLICY "Allow all access to service role on calendar_events"
  ON public.calendar_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
