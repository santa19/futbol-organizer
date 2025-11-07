--
-- PostgreSQL database dump
--

\restrict Wg0guXlgk33ume2wepSHwnVihlsOTdBwTGjFeYaWiuReNtohWEvCquqJ83FB2Ih

-- Dumped from database version 17.6 (Debian 17.6-2.pgdg12+1)
-- Dumped by pg_dump version 17.6 (Debian 17.6-2.pgdg13+1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: futbol_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO futbol_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: matches; Type: TABLE; Schema: public; Owner: futbol_user
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    date text NOT NULL,
    "time" text,
    location text,
    max_players integer DEFAULT 10,
    creator_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    initial_capacity integer DEFAULT 14,
    capacity_history jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.matches OWNER TO futbol_user;

--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: futbol_user
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matches_id_seq OWNER TO futbol_user;

--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: futbol_user
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: participants; Type: TABLE; Schema: public; Owner: futbol_user
--

CREATE TABLE public.participants (
    id integer NOT NULL,
    match_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.participants OWNER TO futbol_user;

--
-- Name: participants_id_seq; Type: SEQUENCE; Schema: public; Owner: futbol_user
--

CREATE SEQUENCE public.participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.participants_id_seq OWNER TO futbol_user;

--
-- Name: participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: futbol_user
--

ALTER SEQUENCE public.participants_id_seq OWNED BY public.participants.id;


--
-- Name: reset_tokens; Type: TABLE; Schema: public; Owner: futbol_user
--

CREATE TABLE public.reset_tokens (
    id integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reset_tokens OWNER TO futbol_user;

--
-- Name: reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: futbol_user
--

CREATE SEQUENCE public.reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reset_tokens_id_seq OWNER TO futbol_user;

--
-- Name: reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: futbol_user
--

ALTER SEQUENCE public.reset_tokens_id_seq OWNED BY public.reset_tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: futbol_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_admin boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO futbol_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: futbol_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO futbol_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: futbol_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: waitlist; Type: TABLE; Schema: public; Owner: futbol_user
--

CREATE TABLE public.waitlist (
    id integer NOT NULL,
    match_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.waitlist OWNER TO futbol_user;

--
-- Name: waitlist_id_seq; Type: SEQUENCE; Schema: public; Owner: futbol_user
--

CREATE SEQUENCE public.waitlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.waitlist_id_seq OWNER TO futbol_user;

--
-- Name: waitlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: futbol_user
--

ALTER SEQUENCE public.waitlist_id_seq OWNED BY public.waitlist.id;


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: participants id; Type: DEFAULT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.participants ALTER COLUMN id SET DEFAULT nextval('public.participants_id_seq'::regclass);


--
-- Name: reset_tokens id; Type: DEFAULT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.reset_tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: waitlist id; Type: DEFAULT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.waitlist ALTER COLUMN id SET DEFAULT nextval('public.waitlist_id_seq'::regclass);


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: futbol_user
--

COPY public.matches (id, date, "time", location, max_players, creator_id, created_at, initial_capacity, capacity_history) FROM stdin;
1	2025-11-09	20:10	11-2	14	2	2025-11-07 16:11:14.729459+00	14	[]
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: futbol_user
--

COPY public.participants (id, match_id, user_id, joined_at) FROM stdin;
1	1	2	2025-11-07 16:11:22.060505+00
\.


--
-- Data for Name: reset_tokens; Type: TABLE DATA; Schema: public; Owner: futbol_user
--

COPY public.reset_tokens (id, email, token, expires_at, used, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: futbol_user
--

COPY public.users (id, name, email, password, created_at, is_admin) FROM stdin;
2	John Doe	jonhDoe@test.com	$2a$10$zmUFg.v7d6wewTHJh2Rd..ukA5F/j9IpyzZUuVx.1ZT.yS1kBP/FW	2025-11-07 15:59:30.108812+00	t
\.


--
-- Data for Name: waitlist; Type: TABLE DATA; Schema: public; Owner: futbol_user
--

COPY public.waitlist (id, match_id, user_id, joined_at) FROM stdin;
\.


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: futbol_user
--

SELECT pg_catalog.setval('public.matches_id_seq', 1, true);


--
-- Name: participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: futbol_user
--

SELECT pg_catalog.setval('public.participants_id_seq', 1, true);


--
-- Name: reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: futbol_user
--

SELECT pg_catalog.setval('public.reset_tokens_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: futbol_user
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: waitlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: futbol_user
--

SELECT pg_catalog.setval('public.waitlist_id_seq', 1, false);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: participants participants_match_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_match_id_user_id_key UNIQUE (match_id, user_id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: reset_tokens reset_tokens_email_token_key; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_email_token_key UNIQUE (email, token);


--
-- Name: reset_tokens reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: waitlist waitlist_match_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_match_id_user_id_key UNIQUE (match_id, user_id);


--
-- Name: waitlist waitlist_pkey; Type: CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_pkey PRIMARY KEY (id);


--
-- Name: matches matches_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: participants participants_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: participants participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: waitlist waitlist_match_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id) ON DELETE CASCADE;


--
-- Name: waitlist waitlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: futbol_user
--

ALTER TABLE ONLY public.waitlist
    ADD CONSTRAINT waitlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO futbol_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO futbol_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO futbol_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO futbol_user;


--
-- PostgreSQL database dump complete
--

\unrestrict Wg0guXlgk33ume2wepSHwnVihlsOTdBwTGjFeYaWiuReNtohWEvCquqJ83FB2Ih

