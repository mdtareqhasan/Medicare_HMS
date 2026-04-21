
-- Doctor availability table
CREATE TABLE IF NOT EXISTS public.doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  break_start time,
  break_end time,
  is_available boolean NOT NULL DEFAULT true,
  slot_duration integer NOT NULL DEFAULT 30,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, day_of_week)
);

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own availability
CREATE POLICY "Doctors manage own availability" ON public.doctor_availability
  FOR ALL USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

-- Everyone authenticated can view availability (for booking)
CREATE POLICY "Authenticated users view availability" ON public.doctor_availability
  FOR SELECT USING (true);

-- Admins manage all
CREATE POLICY "Admins manage all availability" ON public.doctor_availability
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Update appointments status enum: add 'rescheduled'
-- (status is text, so no enum change needed)

-- Add RLS policy for patients to update (cancel/reschedule) their own appointments
CREATE POLICY "Patients can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = patient_id);
