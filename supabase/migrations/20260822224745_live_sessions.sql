-- Add meeting_url for live sessions
ALTER TABLE public.calendar_events 
ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- Update the check constraint to allow 'live_session'
ALTER TABLE public.calendar_events
DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;

ALTER TABLE public.calendar_events
ADD CONSTRAINT calendar_events_event_type_check 
CHECK (event_type IN ('quiz', 'lecture', 'assignment', 'holiday', 'other', 'live_session'));
