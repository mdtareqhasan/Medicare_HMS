
-- Add new patient fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS insurance_provider text,
  ADD COLUMN IF NOT EXISTS insurance_policy_number text,
  ADD COLUMN IF NOT EXISTS blood_group text;

-- Create lab_reports table
CREATE TABLE IF NOT EXISTS public.lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid,
  title text NOT NULL,
  description text,
  result text,
  status text NOT NULL DEFAULT 'pending',
  report_date timestamp with time zone NOT NULL DEFAULT now(),
  file_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

-- RLS for lab_reports
CREATE POLICY "Admins view all lab reports" ON public.lab_reports
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all lab reports" ON public.lab_reports
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can create lab reports" ON public.lab_reports
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors view own lab reports" ON public.lab_reports
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Lab staff can manage lab reports" ON public.lab_reports
  FOR ALL USING (public.has_role(auth.uid(), 'lab_staff'));

CREATE POLICY "Patients view own lab reports" ON public.lab_reports
  FOR SELECT USING (auth.uid() = patient_id);

-- Create medical_documents table
CREATE TABLE IF NOT EXISTS public.medical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all medical documents" ON public.medical_documents
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all medical documents" ON public.medical_documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Doctors can upload medical documents" ON public.medical_documents
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors view patient documents" ON public.medical_documents
  FOR SELECT USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Patients view own documents" ON public.medical_documents
  FOR SELECT USING (auth.uid() = patient_id);

-- Storage bucket for medical files
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-files', 'medical-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload medical files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-files');

CREATE POLICY "Authenticated users can view medical files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'medical-files');
