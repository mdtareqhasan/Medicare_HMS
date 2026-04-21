
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(
    ((SELECT COUNT(*) FROM public.billing WHERE created_at::date = CURRENT_DATE) + 1)::text,
    4, '0'
  )
$$;
