-- Migration: Create student_payments table for tracking monthly payments
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

-- Enable RLS on student_payments
ALTER TABLE student_payments ENABLE ROW LEVEL SECURITY;

-- Policies for student_payments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_payments' AND policyname = 'Admins can manage all student payments') THEN
    CREATE POLICY "Admins can manage all student payments" ON student_payments FOR ALL USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_payments' AND policyname = 'Students can read own payments') THEN
    CREATE POLICY "Students can read own payments" ON student_payments FOR SELECT USING (auth.uid() = student_id);
  END IF;
END$$;
