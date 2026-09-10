CREATE TABLE public.suggestions (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    category text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer,
    CONSTRAINT suggestions_pkey PRIMARY KEY (id),
    CONSTRAINT suggestions_status_check CHECK (status IN ('new', 'read', 'rejected')),
    CONSTRAINT suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX suggestions_created_at_idx ON public.suggestions USING btree (created_at DESC);
CREATE INDEX suggestions_status_idx ON public.suggestions USING btree (status);
CREATE INDEX suggestions_user_id_created_at_idx ON public.suggestions USING btree (user_id, created_at DESC);
