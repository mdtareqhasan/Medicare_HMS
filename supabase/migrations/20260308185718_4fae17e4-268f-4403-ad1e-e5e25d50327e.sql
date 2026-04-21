
-- 1. Add expiry_date to medicines
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS expiry_date date;

-- 2. Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id),
  medical_record_id uuid REFERENCES public.medical_records(id),
  medicines jsonb NOT NULL DEFAULT '[]',
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all prescriptions" ON public.prescriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Doctors create prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = doctor_id);
CREATE POLICY "Doctors view own prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Patients view own prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Pharmacists view all prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'pharmacist'::app_role));
CREATE POLICY "Pharmacists update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'pharmacist'::app_role));

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Create messages table for chat
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users update received messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- 5. Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 6. Add updated_at trigger to prescriptions
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
