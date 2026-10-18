-- Allow admins to delete student profiles (needed by the "Delete" button on /manage/students).
-- Without this, DELETE on profiles silently affects 0 rows under Row Level Security.
DO $$ BEGIN
  CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
