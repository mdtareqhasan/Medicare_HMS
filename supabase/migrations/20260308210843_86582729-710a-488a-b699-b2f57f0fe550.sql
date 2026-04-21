
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS consultation_type text NOT NULL DEFAULT 'in-person',
ADD COLUMN IF NOT EXISTS visit_type text NOT NULL DEFAULT 'new',
ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS symptoms text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS attached_file_url text;
