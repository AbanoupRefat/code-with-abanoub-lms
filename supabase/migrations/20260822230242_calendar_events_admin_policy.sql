-- Allow admins to manage calendar events
CREATE POLICY "Admins can manage calendar events"
  ON public.calendar_events
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
