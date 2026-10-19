-- One-time fees (notes, printing, other), private sessions (one row per session),
-- and a flag for students who are "private only" (not tracked in monthly tuition).

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
