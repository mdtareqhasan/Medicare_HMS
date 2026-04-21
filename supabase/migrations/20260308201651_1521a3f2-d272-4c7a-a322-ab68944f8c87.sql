CREATE POLICY "Nurses view all appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Nurses can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Doctors can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));