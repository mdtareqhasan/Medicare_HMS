
CREATE POLICY "Patients can view doctor roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (role = 'doctor');
