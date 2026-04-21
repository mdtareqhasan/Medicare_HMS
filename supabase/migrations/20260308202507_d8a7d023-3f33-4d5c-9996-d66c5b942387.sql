
ALTER TABLE public.profiles
ADD COLUMN specialization text NULL,
ADD COLUMN degrees text NULL,
ADD COLUMN education text NULL,
ADD COLUMN experience_years integer NULL,
ADD COLUMN experience_details text NULL;
