-- Lebanese University hierarchy:
-- Faculties → Branches → Specialisations → Years → Semesters → Courses
-- Each Branch×Specialisation offering owns its own courses and links (no shared catalog).
-- Link languages: ar / fr / en (one or more per link).

-- Wipe CNAM program tree; LU_Links starts empty under the new shape.
TRUNCATE TABLE public.course_placements RESTART IDENTITY CASCADE;
DELETE FROM public.link_clicks;
DELETE FROM public.favorite_events;
UPDATE public.users SET favorite_course_ids = '{}';
DELETE FROM public.links WHERE course_id IS NOT NULL;
TRUNCATE TABLE public.courses RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.semesters RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.years RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.programs RESTART IDENTITY CASCADE;

CREATE TABLE public.faculties (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT faculties_pkey PRIMARY KEY (id),
    CONSTRAINT faculties_slug_key UNIQUE (slug)
);

CREATE TABLE public.branches (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT branches_pkey PRIMARY KEY (id),
    CONSTRAINT branches_slug_key UNIQUE (slug)
);

CREATE TABLE public.faculty_branches (
    faculty_id integer NOT NULL,
    branch_id integer NOT NULL,
    CONSTRAINT faculty_branches_pkey PRIMARY KEY (faculty_id, branch_id),
    CONSTRAINT faculty_branches_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE,
    CONSTRAINT faculty_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE
);

CREATE TABLE public.specialisations (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    faculty_id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT specialisations_pkey PRIMARY KEY (id),
    CONSTRAINT specialisations_faculty_slug_key UNIQUE (faculty_id, slug),
    CONSTRAINT specialisations_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE
);

CREATE TABLE public.branch_specialisations (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    branch_id integer NOT NULL,
    specialisation_id integer NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    CONSTRAINT branch_specialisations_pkey PRIMARY KEY (id),
    CONSTRAINT branch_specialisations_branch_spec_key UNIQUE (branch_id, specialisation_id),
    CONSTRAINT branch_specialisations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE,
    CONSTRAINT branch_specialisations_specialisation_id_fkey FOREIGN KEY (specialisation_id) REFERENCES public.specialisations(id) ON DELETE CASCADE
);

-- years: program_id → branch_specialisation_id
ALTER TABLE public.years DROP CONSTRAINT IF EXISTS years_program_id_fkey;
ALTER TABLE public.years RENAME COLUMN program_id TO branch_specialisation_id;
ALTER TABLE public.years
    ADD CONSTRAINT years_branch_specialisation_id_fkey
    FOREIGN KEY (branch_specialisation_id) REFERENCES public.branch_specialisations(id) ON DELETE CASCADE;

-- courses belong to a semester again (fully separate trees; codes may repeat)
DROP INDEX IF EXISTS public.courses_code_lower_uidx;
ALTER TABLE public.courses
    ADD COLUMN semester_id integer,
    ADD COLUMN display_order integer DEFAULT 0 NOT NULL;
ALTER TABLE public.courses
    ADD CONSTRAINT courses_semester_id_fkey
    FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE;
ALTER TABLE public.courses
    ALTER COLUMN semester_id SET NOT NULL;

DROP TABLE public.course_placements;
DROP TABLE public.programs;

ALTER TABLE public.links
    ADD COLUMN languages jsonb NOT NULL DEFAULT '[]'::jsonb;

-- CHECK cannot contain subqueries; validate via IMMUTABLE function instead.
CREATE OR REPLACE FUNCTION public.links_languages_valid(langs jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT jsonb_typeof(langs) = 'array'
       AND NOT EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(langs) AS lang
           WHERE lang NOT IN ('ar', 'fr', 'en')
       );
$$;

ALTER TABLE public.links
    ADD CONSTRAINT links_languages_valid_check
    CHECK (public.links_languages_valid(languages));
