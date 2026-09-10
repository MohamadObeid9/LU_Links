--
-- PostgreSQL database dump
--

\restrict 926R7scKBYzBTudNZF4ZMJ5QerwuDgoYeFj2MxCcXHc74HbWNeInsj2xBKrdSc5

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: links_languages_valid(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.links_languages_valid(langs jsonb) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$
    SELECT jsonb_typeof(langs) = 'array'
       AND NOT EXISTS (
           SELECT 1
           FROM jsonb_array_elements_text(langs) AS lang
           WHERE lang NOT IN ('ar', 'fr', 'en')
       );
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: branch_specialisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch_specialisations (
    id integer NOT NULL,
    branch_id integer NOT NULL,
    specialisation_id integer NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: branch_specialisations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.branch_specialisations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.branch_specialisations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: branches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.branches ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.branches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: browse_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.browse_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    step text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT browse_events_step_chk CHECK ((step = ANY (ARRAY['year'::text, 'list'::text])))
);


--
-- Name: browse_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.browse_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.browse_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contributions (
    id integer NOT NULL,
    course_name text NOT NULL,
    link_url text NOT NULL,
    note text DEFAULT ''::text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    user_id integer
);


--
-- Name: contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.contributions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.contributions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    is_optional boolean DEFAULT false,
    semester_id integer NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.courses ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.courses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: extra_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_links (
    id integer NOT NULL,
    section_id integer,
    type text NOT NULL,
    url text NOT NULL,
    label text DEFAULT 'Link'::text,
    note text DEFAULT ''::text,
    display_order integer DEFAULT 0,
    content_type text,
    CONSTRAINT extra_links_type_check CHECK ((type = ANY (ARRAY['telegram'::text, 'drive'::text, 'classroom'::text, 'other'::text])))
);


--
-- Name: extra_links_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.extra_links ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.extra_links_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: extra_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extra_sections (
    id integer NOT NULL,
    title text NOT NULL,
    icon text DEFAULT '📁'::text,
    display_order integer DEFAULT 0
);


--
-- Name: extra_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.extra_sections ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.extra_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: faculties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculties (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: faculties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.faculties ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.faculties_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: faculty_branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faculty_branches (
    faculty_id integer NOT NULL,
    branch_id integer NOT NULL
);


--
-- Name: favorite_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorite_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    course_id integer NOT NULL,
    action text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT favorite_events_action_check CHECK ((action = ANY (ARRAY['added'::text, 'removed'::text])))
);


--
-- Name: favorite_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.favorite_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.favorite_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    category text NOT NULL,
    rating integer NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer,
    CONSTRAINT feedback_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT feedback_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'rejected'::text])))
);


--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.feedback ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: link_clicks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.link_clicks (
    id integer NOT NULL,
    link_id integer,
    clicked_at timestamp with time zone DEFAULT now(),
    extra_link_id integer,
    user_id integer,
    CONSTRAINT link_clicks_one_target_chk CHECK ((((link_id IS NOT NULL) AND (extra_link_id IS NULL)) OR ((link_id IS NULL) AND (extra_link_id IS NOT NULL))))
);


--
-- Name: link_clicks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.link_clicks ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.link_clicks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.links (
    id integer NOT NULL,
    course_id integer,
    type text NOT NULL,
    url text NOT NULL,
    label text DEFAULT 'Link'::text,
    note text DEFAULT ''::text,
    display_order integer DEFAULT 0,
    content_type text,
    languages jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT links_languages_valid_check CHECK (public.links_languages_valid(languages)),
    CONSTRAINT links_type_check CHECK ((type = ANY (ARRAY['telegram'::text, 'drive'::text, 'classroom'::text, 'other'::text])))
);


--
-- Name: links_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.links ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.links_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_views (
    id integer NOT NULL,
    visited_at timestamp with time zone DEFAULT now(),
    page text DEFAULT 'home'::text,
    user_id integer,
    device_type text,
    CONSTRAINT page_views_device_type_chk CHECK (((device_type IS NULL) OR (device_type = ANY (ARRAY['phone'::text, 'laptop'::text]))))
);


--
-- Name: page_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.page_views ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.page_views_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    course_name text NOT NULL,
    link_url text DEFAULT ''::text,
    description text NOT NULL,
    status text DEFAULT 'open'::text,
    created_at timestamp with time zone DEFAULT now(),
    user_id integer
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reports ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version bigint NOT NULL,
    dirty boolean NOT NULL
);


--
-- Name: search_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_events (
    id integer NOT NULL,
    user_id integer NOT NULL,
    query text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: search_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.search_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.search_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: semesters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.semesters (
    id integer NOT NULL,
    year_id integer,
    name text NOT NULL,
    display_order integer DEFAULT 0
);


--
-- Name: semesters_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.semesters ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.semesters_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: specialisations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.specialisations (
    id integer NOT NULL,
    faculty_id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: specialisations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.specialisations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.specialisations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suggestions (
    id integer NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer,
    CONSTRAINT suggestions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'rejected'::text])))
);


--
-- Name: suggestions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.suggestions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.suggestions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    first_name text,
    last_name text,
    number integer,
    is_guest boolean DEFAULT false NOT NULL,
    favorite_course_ids integer[] DEFAULT '{}'::integer[] NOT NULL,
    prefered_lang text DEFAULT 'eng'::text NOT NULL,
    prefered_theme text DEFAULT 'system'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_number_range_chk CHECK (((number IS NULL) OR ((number >= 1) AND (number <= 100)))),
    CONSTRAINT users_prefered_lang_check CHECK ((prefered_lang = ANY (ARRAY['eng'::text, 'fr'::text, 'ar'::text]))),
    CONSTRAINT users_prefered_theme_check CHECK ((prefered_theme = ANY (ARRAY['system'::text, 'dark'::text, 'light'::text])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.years (
    id integer NOT NULL,
    branch_specialisation_id integer,
    name text NOT NULL,
    display_order integer DEFAULT 0
);


--
-- Name: years_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.years ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.years_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: branch_specialisations branch_specialisations_branch_spec_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_specialisations
    ADD CONSTRAINT branch_specialisations_branch_spec_key UNIQUE (branch_id, specialisation_id);


--
-- Name: branch_specialisations branch_specialisations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_specialisations
    ADD CONSTRAINT branch_specialisations_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: branches branches_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_slug_key UNIQUE (slug);


--
-- Name: browse_events browse_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.browse_events
    ADD CONSTRAINT browse_events_pkey PRIMARY KEY (id);


--
-- Name: contributions contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: extra_links extra_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_links
    ADD CONSTRAINT extra_links_pkey PRIMARY KEY (id);


--
-- Name: extra_sections extra_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_sections
    ADD CONSTRAINT extra_sections_pkey PRIMARY KEY (id);


--
-- Name: faculties faculties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (id);


--
-- Name: faculties faculties_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_slug_key UNIQUE (slug);


--
-- Name: faculty_branches faculty_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_branches
    ADD CONSTRAINT faculty_branches_pkey PRIMARY KEY (faculty_id, branch_id);


--
-- Name: favorite_events favorite_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_events
    ADD CONSTRAINT favorite_events_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: link_clicks link_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_clicks
    ADD CONSTRAINT link_clicks_pkey PRIMARY KEY (id);


--
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: search_events search_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_events
    ADD CONSTRAINT search_events_pkey PRIMARY KEY (id);


--
-- Name: semesters semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_pkey PRIMARY KEY (id);


--
-- Name: specialisations specialisations_faculty_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialisations
    ADD CONSTRAINT specialisations_faculty_slug_key UNIQUE (faculty_id, slug);


--
-- Name: specialisations specialisations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialisations
    ADD CONSTRAINT specialisations_pkey PRIMARY KEY (id);


--
-- Name: suggestions suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: years years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.years
    ADD CONSTRAINT years_pkey PRIMARY KEY (id);


--
-- Name: browse_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX browse_events_created_at_idx ON public.browse_events USING btree (created_at DESC);


--
-- Name: browse_events_step_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX browse_events_step_created_at_idx ON public.browse_events USING btree (step, created_at DESC);


--
-- Name: contributions_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contributions_user_id_created_at_idx ON public.contributions USING btree (user_id, created_at DESC);


--
-- Name: favorite_events_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX favorite_events_user_id_created_at_idx ON public.favorite_events USING btree (user_id, created_at DESC);


--
-- Name: feedback_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feedback_user_id_created_at_idx ON public.feedback USING btree (user_id, created_at DESC);


--
-- Name: link_clicks_user_id_clicked_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX link_clicks_user_id_clicked_at_idx ON public.link_clicks USING btree (user_id, clicked_at DESC);


--
-- Name: links_course_url_lower_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX links_course_url_lower_uidx ON public.links USING btree (course_id, lower(TRIM(BOTH FROM url))) WHERE (course_id IS NOT NULL);


--
-- Name: page_views_user_id_visited_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX page_views_user_id_visited_at_idx ON public.page_views USING btree (user_id, visited_at DESC);


--
-- Name: reports_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reports_user_id_created_at_idx ON public.reports USING btree (user_id, created_at DESC);


--
-- Name: search_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_events_created_at_idx ON public.search_events USING btree (created_at DESC);


--
-- Name: search_events_query_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_events_query_created_at_idx ON public.search_events USING btree (query, created_at DESC);


--
-- Name: suggestions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suggestions_created_at_idx ON public.suggestions USING btree (created_at DESC);


--
-- Name: suggestions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suggestions_status_idx ON public.suggestions USING btree (status);


--
-- Name: suggestions_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suggestions_user_id_created_at_idx ON public.suggestions USING btree (user_id, created_at DESC);


--
-- Name: users_unique_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_unique_username ON public.users USING btree (first_name, last_name, number) WHERE (is_guest = false);


--
-- Name: branch_specialisations branch_specialisations_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_specialisations
    ADD CONSTRAINT branch_specialisations_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: branch_specialisations branch_specialisations_specialisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_specialisations
    ADD CONSTRAINT branch_specialisations_specialisation_id_fkey FOREIGN KEY (specialisation_id) REFERENCES public.specialisations(id) ON DELETE CASCADE;


--
-- Name: browse_events browse_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.browse_events
    ADD CONSTRAINT browse_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contributions contributions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contributions
    ADD CONSTRAINT contributions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: courses courses_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id) ON DELETE CASCADE;


--
-- Name: extra_links extra_links_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extra_links
    ADD CONSTRAINT extra_links_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.extra_sections(id) ON DELETE CASCADE;


--
-- Name: faculty_branches faculty_branches_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_branches
    ADD CONSTRAINT faculty_branches_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: faculty_branches faculty_branches_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faculty_branches
    ADD CONSTRAINT faculty_branches_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE;


--
-- Name: favorite_events favorite_events_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_events
    ADD CONSTRAINT favorite_events_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: favorite_events favorite_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorite_events
    ADD CONSTRAINT favorite_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: link_clicks link_clicks_extra_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_clicks
    ADD CONSTRAINT link_clicks_extra_link_id_fkey FOREIGN KEY (extra_link_id) REFERENCES public.extra_links(id) ON DELETE CASCADE;


--
-- Name: link_clicks link_clicks_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_clicks
    ADD CONSTRAINT link_clicks_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE CASCADE;


--
-- Name: link_clicks link_clicks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_clicks
    ADD CONSTRAINT link_clicks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: links links_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: page_views page_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: search_events search_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_events
    ADD CONSTRAINT search_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: semesters semesters_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.semesters
    ADD CONSTRAINT semesters_year_id_fkey FOREIGN KEY (year_id) REFERENCES public.years(id) ON DELETE CASCADE;


--
-- Name: specialisations specialisations_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.specialisations
    ADD CONSTRAINT specialisations_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculties(id) ON DELETE CASCADE;


--
-- Name: suggestions suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: years years_branch_specialisation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.years
    ADD CONSTRAINT years_branch_specialisation_id_fkey FOREIGN KEY (branch_specialisation_id) REFERENCES public.branch_specialisations(id) ON DELETE CASCADE;


--
-- Name: branch_specialisations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branch_specialisations ENABLE ROW LEVEL SECURITY;

--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: browse_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.browse_events ENABLE ROW LEVEL SECURITY;

--
-- Name: contributions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_links ENABLE ROW LEVEL SECURITY;

--
-- Name: extra_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.extra_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: faculties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;

--
-- Name: faculty_branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.faculty_branches ENABLE ROW LEVEL SECURITY;

--
-- Name: favorite_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorite_events ENABLE ROW LEVEL SECURITY;

--
-- Name: feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: link_clicks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

--
-- Name: links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: search_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

--
-- Name: semesters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

--
-- Name: specialisations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.specialisations ENABLE ROW LEVEL SECURITY;

--
-- Name: suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: years; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict 926R7scKBYzBTudNZF4ZMJ5QerwuDgoYeFj2MxCcXHc74HbWNeInsj2xBKrdSc5

