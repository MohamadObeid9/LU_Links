-- Optional Arabic display names for hierarchy labels.
-- Empty / NULL means clients fall back to the English `name`.

ALTER TABLE public.faculties
    ADD COLUMN name_ar text NOT NULL DEFAULT '';

ALTER TABLE public.branches
    ADD COLUMN name_ar text NOT NULL DEFAULT '';

ALTER TABLE public.specialisations
    ADD COLUMN name_ar text NOT NULL DEFAULT '';
