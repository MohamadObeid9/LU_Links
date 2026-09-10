-- Reverse LU hierarchy back toward programs + placements.
-- Academic data under branch_specialisations is wiped; not lossless.

TRUNCATE TABLE public.semesters RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.years RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.branch_specialisations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.specialisations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.faculty_branches RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.branches RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.faculties RESTART IDENTITY CASCADE;
DELETE FROM public.link_clicks;
DELETE FROM public.favorite_events;
UPDATE public.users SET favorite_course_ids = '{}';
DELETE FROM public.links WHERE course_id IS NOT NULL;
TRUNCATE TABLE public.courses RESTART IDENTITY CASCADE;

ALTER TABLE public.links DROP CONSTRAINT IF EXISTS links_languages_valid_check;
ALTER TABLE public.links DROP COLUMN IF EXISTS languages;
DROP FUNCTION IF EXISTS public.links_languages_valid(jsonb);
-- languages was jsonb of ar/fr/en codes

CREATE TABLE public.programs (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT programs_pkey PRIMARY KEY (id),
    CONSTRAINT programs_slug_key UNIQUE (slug)
);

ALTER TABLE public.years DROP CONSTRAINT IF EXISTS years_branch_specialisation_id_fkey;
ALTER TABLE public.years RENAME COLUMN branch_specialisation_id TO program_id;
ALTER TABLE public.years
    ADD CONSTRAINT years_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES public.programs(id) ON DELETE CASCADE;

CREATE TABLE public.course_placements (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    course_id integer NOT NULL,
    semester_id integer NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT course_placements_pkey PRIMARY KEY (id),
    CONSTRAINT course_placements_course_semester_key UNIQUE (course_id, semester_id),
    CONSTRAINT course_placements_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
    CONSTRAINT course_placements_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE
);

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_semester_id_fkey;
ALTER TABLE public.courses DROP COLUMN IF EXISTS semester_id;
ALTER TABLE public.courses DROP COLUMN IF EXISTS display_order;

CREATE UNIQUE INDEX courses_code_lower_uidx
    ON public.courses (lower(trim(code)))
    WHERE code IS NOT NULL AND trim(code) <> '';

DROP TABLE IF EXISTS public.branch_specialisations;
DROP TABLE IF EXISTS public.specialisations;
DROP TABLE IF EXISTS public.faculty_branches;
DROP TABLE IF EXISTS public.branches;
DROP TABLE IF EXISTS public.faculties;
