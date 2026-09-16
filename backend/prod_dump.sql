--
-- PostgreSQL database dump
--

\restrict FgToO0jSKE7lQRrT9eui5UCq4Nc4Egeda2MeJCknYLlrgsCUxHW4ogB49OhbrUt

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.users DROP CONSTRAINT users_role_id_fkey;
ALTER TABLE ONLY public.trips DROP CONSTRAINT trips_vehicle_id_fkey;
ALTER TABLE ONLY public.trips DROP CONSTRAINT trips_price_rate_id_fkey;
ALTER TABLE ONLY public.trips DROP CONSTRAINT trips_passenger_id_fkey;
ALTER TABLE ONLY public.trips DROP CONSTRAINT trips_origin_place_id_fkey;
ALTER TABLE ONLY public.trips DROP CONSTRAINT trips_driver_id_fkey;
ALTER TABLE ONLY public.trips DROP CONSTRAINT trips_destination_place_id_fkey;
ALTER TABLE ONLY public.routes DROP CONSTRAINT routes_price_rate_id_fkey;
ALTER TABLE ONLY public.routes DROP CONSTRAINT routes_passenger_id_fkey;
ALTER TABLE ONLY public.routes DROP CONSTRAINT routes_origin_place_id_fkey;
ALTER TABLE ONLY public.routes DROP CONSTRAINT routes_driver_id_fkey;
ALTER TABLE ONLY public.routes DROP CONSTRAINT routes_destination_place_id_fkey;
ALTER TABLE ONLY public.drivers_vehicles DROP CONSTRAINT drivers_vehicles_vehicle_id_fkey;
ALTER TABLE ONLY public.drivers_vehicles DROP CONSTRAINT drivers_vehicles_driver_id_fkey;
ALTER TABLE ONLY public.driver_payments DROP CONSTRAINT driver_payments_driver_id_fkey;
ALTER TABLE ONLY public.vehicles DROP CONSTRAINT vehicles_plate_key;
ALTER TABLE ONLY public.vehicles DROP CONSTRAINT vehicles_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY public.trips DROP CONSTRAINT trips_pkey;
ALTER TABLE ONLY public.settings DROP CONSTRAINT settings_pkey;
ALTER TABLE ONLY public.routes DROP CONSTRAINT routes_pkey;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_name_key;
ALTER TABLE ONLY public.price_rates DROP CONSTRAINT price_rates_pkey;
ALTER TABLE ONLY public.places DROP CONSTRAINT places_pkey;
ALTER TABLE ONLY public.passengers DROP CONSTRAINT passengers_pkey;
ALTER TABLE ONLY public.drivers_vehicles DROP CONSTRAINT drivers_vehicles_pkey;
ALTER TABLE ONLY public.driver_payments DROP CONSTRAINT driver_payments_pkey;
ALTER TABLE public.roles ALTER COLUMN id DROP DEFAULT;
DROP TABLE public.vehicles;
DROP TABLE public.users;
DROP TABLE public.trips;
DROP TABLE public.settings;
DROP TABLE public.routes;
DROP SEQUENCE public.roles_id_seq;
DROP TABLE public.roles;
DROP TABLE public.price_rates;
DROP TABLE public.places;
DROP TABLE public.passengers;
DROP TABLE public.drivers_vehicles;
DROP TABLE public.driver_payments;
DROP EXTENSION "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: driver_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.driver_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id uuid,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    period_start date,
    period_end date,
    observations text
);


ALTER TABLE public.driver_payments OWNER TO postgres;

--
-- Name: drivers_vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.drivers_vehicles (
    driver_id uuid NOT NULL,
    vehicle_id uuid NOT NULL
);


ALTER TABLE public.drivers_vehicles OWNER TO postgres;

--
-- Name: passengers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.passengers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20),
    email character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.passengers OWNER TO postgres;

--
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    address character varying(255),
    lat numeric(10,8),
    lng numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.places OWNER TO postgres;

--
-- Name: price_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.price_rates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    price_per_km numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.price_rates OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.routes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    driver_id uuid,
    passenger_id uuid,
    origin_place_id uuid,
    destination_place_id uuid,
    distance_km numeric(10,2),
    price_rate_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.routes OWNER TO postgres;

--
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer DEFAULT 1 NOT NULL,
    default_lat numeric(10,8),
    default_lng numeric(11,8),
    calendar_start_time character varying(5) DEFAULT '00:00'::character varying,
    calendar_end_time character varying(5) DEFAULT '23:59'::character varying,
    calendar_default_view character varying(20) DEFAULT 'month'::character varying
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- Name: trips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trips (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id uuid,
    vehicle_id uuid,
    passenger_id uuid,
    origin_place_id uuid,
    destination_place_id uuid,
    distance_km numeric(10,2),
    price_rate_id uuid,
    total_price numeric(10,2),
    scheduled_time timestamp without time zone,
    status character varying(50) DEFAULT 'pending'::character varying,
    payment_status character varying(50) DEFAULT 'pending'::character varying,
    payment_id uuid,
    paid_amount numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp without time zone
);


ALTER TABLE public.trips OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    role_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plate character varying(20) NOT NULL,
    brand character varying(50),
    model character varying(50),
    capacity integer DEFAULT 4 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Data for Name: driver_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.driver_payments (id, driver_id, amount, payment_method, created_at, period_start, period_end, observations) FROM stdin;
5b982a1c-b6ed-4e36-8441-983c2697ba5f	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	7200.00	efectivo	2026-09-15 19:05:51.439299	\N	\N	\N
\.


--
-- Data for Name: drivers_vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.drivers_vehicles (driver_id, vehicle_id) FROM stdin;
\.


--
-- Data for Name: passengers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.passengers (id, name, phone, email, created_at) FROM stdin;
c611afe1-67ef-4220-adc8-04e9f63acc18	Martina	\N	\N	2026-09-14 17:08:34.26062
12053bf9-fab5-4a56-9c30-c12fc589bd4c	Luz	\N	\N	2026-09-14 17:08:41.203364
63eae53f-9522-48a1-bcec-3edc5f3a2bf8	Emi	\N	\N	2026-09-14 17:08:47.683134
854fc740-a39a-4e4a-aff0-61b0ad7afdcf	Enzo	\N	\N	2026-09-14 17:08:58.542501
6252b153-8a67-4505-a9b3-b5660b1113ee	abel	\N	\N	2026-09-15 00:16:33.375915
5cfe05c9-1f65-4864-a5d4-368bf7cc9a49	flor	\N	\N	2026-09-15 00:16:40.628841
fee251fe-ea99-478b-a807-aa6d295edf12	eliana	\N	\N	2026-09-15 00:16:53.524338
e8e8bd81-ab8d-400b-8ca0-349eea10a824	simon	\N	\N	2026-09-15 00:17:09.081964
989c9538-d754-411f-a8a8-03efd4b14b18	Guille	\N	\N	2026-09-15 21:16:32.886197
7ac6bec6-6a0f-4863-8902-ffb7085a0e09	Romina		\N	2026-09-15 21:17:04.460474
\.


--
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.places (id, name, address, lat, lng, created_at) FROM stdin;
df6c31a5-ecb4-4bee-a0ce-fd6e6da5e6d2	casa luz	newbery 1558	-27.39956380	-55.89526713	2026-09-14 23:36:37.211391
99b71a9c-51b1-472c-95a1-90a7bd04e113	CASA DE MARTINA	newbery 1901	-27.39941921	-55.89916706	2026-09-14 22:36:44.135866
8dc2b33e-2c5d-4bf7-a566-171c3b51121e	casa emilia	irupe 10706	-27.40375007	-55.98449618	2026-09-14 23:44:08.746516
0d757c10-7a16-4683-a2df-fa974eaeebe1	emilia cefap	mitre 1619	-27.37509069	-55.89278072	2026-09-14 23:47:08.202996
409c00e7-5013-43ff-9108-8919bce5f3bf	luz fonoaudiologia	bolivar2291	-27.36653954	-55.89858234	2026-09-14 23:39:41.71975
288dc8e7-07d8-432c-9158-049e6a6b6d0c	luz psicopedagogia	haro 3051	-27.37786312	-55.90268880	2026-09-14 23:41:15.408887
3d89055d-37a7-425c-8bc4-0fde4bfb782d	luz psicologa	suiza 1606	-27.39281495	-55.89552999	2026-09-14 23:38:10.256792
e9f61e77-6925-4652-bd63-a0c6aaee7799	emilia fonoaudiologia	jujuy 1669	-27.36524371	-55.89963108	2026-09-14 23:49:49.869221
7ec5f49f-178a-46e0-90cd-0b60654ab7ba	ESCUELA MARTINA 	parodi y tripoli	-27.38574178	-55.90931922	2026-09-14 22:38:01.90111
2f0eae5a-5761-4dcf-9466-f786f6a07e81	escuela flor	lopez y planes	-27.37294701	-55.91222674	2026-09-15 00:01:32.084284
bf0a548e-f011-4da9-9050-0458e7c6efae	facultad eliana	montoya	-27.36831176	-55.89706153	2026-09-15 00:02:16.437378
1b9ffd19-c3fc-40b4-a280-756efa7f8a2c	abel fono	haro 3051	\N	\N	2026-09-15 00:02:57.970124
6fc2eb95-97cf-49a7-8865-6455f8fde619	abel-flor psicologa-psicopedagoga	cabred y haro	-27.38402700	-55.90337545	2026-09-15 00:04:15.095441
448ae411-2c9c-461e-823d-d7958703ac90	casa enzo	calle 68 6244	-27.37615775	-55.93780428	2026-09-15 00:05:30.516747
b62576d3-c79c-41b3-a0ac-3a4c6428b5b6	enzo psicologa-psicopedagoga(senni)	san lorenzoy sarmiento 1979	-27.36501504	-55.89532346	2026-09-15 00:07:23.127562
b8c34006-95b5-461c-9b0c-d4bfb0b52bd1	enzo fonoaudiologia	roque gonzalez 868(edificio puertas de hierro)	-27.35771617	-55.89452952	2026-09-15 00:09:58.160558
a6835c7d-2670-4871-8299-21193036a9d1	enzo escuela 	cabred 1551	-27.38509398	-55.89370340	2026-09-15 00:12:04.930878
0878c46e-0814-414e-9aeb-b13819508100	simon lorena	peña y bolivar	-27.36776390	-55.88740557	2026-09-15 00:14:08.659628
5e6f059a-aeb0-4d12-bfec-8370fa3e1f1f	casa abel	palo rosa 12784	-27.39872557	-56.00117415	2026-09-15 00:00:22.313829
27baf5dc-2a08-4b8a-b902-6e4d1d234e39	escuela abel	avenida eva peron y tacuari	-27.36612336	-55.94641149	2026-09-15 00:21:31.91842
d8e90a13-b2cc-4c3f-8dc6-43904aa87007	simon casa abuela	calle barreiro 5820	-27.37253733	-55.93386143	2026-09-15 00:28:23.598992
0dfa8139-fd23-446f-82bc-b1e35e9cb49d	casa romina	\N	-27.41701747	-55.91980666	2026-09-15 21:06:00.65136
e163d3eb-076e-4f6f-aa0b-8276385d4799	escuela romina	san lorenzo y catamarca	-27.37042694	-55.89602619	2026-09-15 21:07:01.90495
6a89d9ae-11ab-4221-b058-3e682e09d912	guille vanesa	calle bolivia	-27.39127175	-55.90359002	2026-09-15 21:14:04.987516
e61cf0e1-8c4a-4b45-bd94-6b0267dfc366	casa guille	calle irigoyen	-27.36388117	-55.92429668	2026-09-15 21:15:13.565053
\.


--
-- Data for Name: price_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.price_rates (id, name, price_per_km, created_at) FROM stdin;
a68ed850-39d2-4da4-a6c7-97ac81495f9f	TARIFA particular	1000.00	2026-09-14 22:39:26.794937
18321056-3951-4485-9681-b22d59e4ccf3	tarifa obra social	1200.00	2026-09-15 00:19:11.608863
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name) FROM stdin;
1	admin
2	driver
\.


--
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.routes (id, name, driver_id, passenger_id, origin_place_id, destination_place_id, distance_km, price_rate_id, created_at) FROM stdin;
f1399fba-3f78-40a1-a438-89e4c2ee5565	emilia casa-escuela	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	63eae53f-9522-48a1-bcec-3edc5f3a2bf8	8dc2b33e-2c5d-4bf7-a566-171c3b51121e	0d757c10-7a16-4683-a2df-fa974eaeebe1	12.48	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 00:34:27.998018
f084f41c-2707-42ec-b851-e413081d8596	abel escuela-casa	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	6252b153-8a67-4505-a9b3-b5660b1113ee	5e6f059a-aeb0-4d12-bfec-8370fa3e1f1f	27baf5dc-2a08-4b8a-b902-6e4d1d234e39	11.00	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 21:10:47.048886
d40de6fe-9c74-4b76-abfa-9d3ed7a30b96	romina casa-escuela	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	7ac6bec6-6a0f-4863-8902-ffb7085a0e09	0dfa8139-fd23-446f-82bc-b1e35e9cb49d	e163d3eb-076e-4f6f-aa0b-8276385d4799	7.00	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 21:26:26.116615
ce0dd118-c3d4-40c5-a2f4-a1e47b7577a9	guille vanesa-casa	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	989c9538-d754-411f-a8a8-03efd4b14b18	e61cf0e1-8c4a-4b45-bd94-6b0267dfc366	6a89d9ae-11ab-4221-b058-3e682e09d912	5.00	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 21:27:17.031244
0fa7f0d3-4ac0-442d-ae19-f26acc91011c	martina casa-escuela	2f7e37e5-c4cf-429e-9e7b-24e160a092b2	c611afe1-67ef-4220-adc8-04e9f63acc18	99b71a9c-51b1-472c-95a1-90a7bd04e113	7ec5f49f-178a-46e0-90cd-0b60654ab7ba	2.40	a68ed850-39d2-4da4-a6c7-97ac81495f9f	2026-09-15 00:33:26.807912
b68bab10-6794-479a-be4c-fce44aec9c60	enzo casa-escuela	2f7e37e5-c4cf-429e-9e7b-24e160a092b2	854fc740-a39a-4e4a-aff0-61b0ad7afdcf	448ae411-2c9c-461e-823d-d7958703ac90	a6835c7d-2670-4871-8299-21193036a9d1	5.81	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 21:29:28.322623
60ca6747-2b6a-47ab-8579-09c79edd9f4a	abel fono	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	6252b153-8a67-4505-a9b3-b5660b1113ee	5e6f059a-aeb0-4d12-bfec-8370fa3e1f1f	1b9ffd19-c3fc-40b4-a280-756efa7f8a2c	16.00	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 21:31:45.24554
52c0fba7-0f39-46aa-9be0-1395bb357d91	abel-flor psicologa	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	5cfe05c9-1f65-4864-a5d4-368bf7cc9a49	5e6f059a-aeb0-4d12-bfec-8370fa3e1f1f	6fc2eb95-97cf-49a7-8865-6455f8fde619	14.00	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 21:33:02.437561
f41731db-ee5e-4e8f-a99a-a48e9433faad	enzo seni-casa	2f7e37e5-c4cf-429e-9e7b-24e160a092b2	854fc740-a39a-4e4a-aff0-61b0ad7afdcf	a6835c7d-2670-4871-8299-21193036a9d1	b62576d3-c79c-41b3-a0ac-3a4c6428b5b6	3.00	18321056-3951-4485-9681-b22d59e4ccf3	2026-09-15 21:34:59.684821
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, default_lat, default_lng, calendar_start_time, calendar_end_time, calendar_default_view) FROM stdin;
1	-27.36807527	-55.89448929	06:00	22:00	week
\.


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trips (id, driver_id, vehicle_id, passenger_id, origin_place_id, destination_place_id, distance_km, price_rate_id, total_price, scheduled_time, status, payment_status, payment_id, paid_amount, created_at, ended_at) FROM stdin;
bbeedc72-9b92-4278-bad0-33b62ce47c11	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	\N	5cfe05c9-1f65-4864-a5d4-368bf7cc9a49	2f0eae5a-5761-4dcf-9466-f786f6a07e81	5e6f059a-aeb0-4d12-bfec-8370fa3e1f1f	14.00	18321056-3951-4485-9681-b22d59e4ccf3	16800.00	2026-09-15 16:00:00	completed	pending	\N	0.00	2026-09-15 00:18:30.035891	2026-09-15 19:01:18.310268
cd1417b0-28a9-4cd3-a023-d6e9b32b6ae7	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	\N	e8e8bd81-ab8d-400b-8ca0-349eea10a824	0878c46e-0814-414e-9aeb-b13819508100	d8e90a13-b2cc-4c3f-8dc6-43904aa87007	6.00	18321056-3951-4485-9681-b22d59e4ccf3	7200.00	2026-09-15 13:45:00	completed	paid	\N	7200.00	2026-09-15 00:30:13.417735	2026-09-15 19:01:44.288995
50f48e24-63fc-4356-b3b9-6044ef9b84df	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	\N	989c9538-d754-411f-a8a8-03efd4b14b18	6a89d9ae-11ab-4221-b058-3e682e09d912	e61cf0e1-8c4a-4b45-bd94-6b0267dfc366	5.00	18321056-3951-4485-9681-b22d59e4ccf3	\N	2026-09-16 20:00:00	scheduled	pending	\N	0.00	2026-09-15 21:18:06.419105	\N
5e5f93e2-7839-4aa8-a4ba-3753ea542389	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	\N	7ac6bec6-6a0f-4863-8902-ffb7085a0e09	0dfa8139-fd23-446f-82bc-b1e35e9cb49d	e163d3eb-076e-4f6f-aa0b-8276385d4799	7.00	18321056-3951-4485-9681-b22d59e4ccf3	\N	2026-09-16 11:00:00	scheduled	pending	\N	0.00	2026-09-15 21:19:04.715347	\N
cd05e43f-5ae9-4640-ab55-b46f31b38146	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	\N	7ac6bec6-6a0f-4863-8902-ffb7085a0e09	e163d3eb-076e-4f6f-aa0b-8276385d4799	0dfa8139-fd23-446f-82bc-b1e35e9cb49d	7.00	18321056-3951-4485-9681-b22d59e4ccf3	\N	2026-09-16 12:30:00	scheduled	pending	\N	0.00	2026-09-15 21:19:52.100166	\N
c9f18a4f-d515-4ffe-a682-e60c14685067	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	\N	7ac6bec6-6a0f-4863-8902-ffb7085a0e09	e163d3eb-076e-4f6f-aa0b-8276385d4799	0dfa8139-fd23-446f-82bc-b1e35e9cb49d	7.00	18321056-3951-4485-9681-b22d59e4ccf3	\N	2026-09-16 21:30:00	scheduled	pending	\N	0.00	2026-09-15 21:20:29.115285	\N
2499e240-fc41-4366-b25b-45415570e62a	7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	\N	6252b153-8a67-4505-a9b3-b5660b1113ee	5e6f059a-aeb0-4d12-bfec-8370fa3e1f1f	27baf5dc-2a08-4b8a-b902-6e4d1d234e39	11.00	18321056-3951-4485-9681-b22d59e4ccf3	\N	2026-09-16 10:00:00	scheduled	pending	\N	0.00	2026-09-15 21:04:48.629757	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone, password_hash, role_id, created_at) FROM stdin;
e8a04091-6d17-47ae-979b-ae3a572274e3	Administrador	admin@viajesq.com	\N	$2b$10$uI9ENVt1CrJ35qK78taxNerkNkmwsDehkEdxuKeZwxAfRdDYAEldW	1	2026-09-12 18:02:30.156912
2f7e37e5-c4cf-429e-9e7b-24e160a092b2	  Jorge	jorge@viajesq.com	111	$2b$10$ZOploQZgImnkQHGA8BKDgOD8IkmY21hpmO4uBWGV6MahJGZjmtoHW	2	2026-09-14 22:34:15.509795
7f5bbe15-8d8e-4a36-b5ae-f12d41cfaa9d	Diego	diego@viajesq.com	\N	$2b$10$Fxy0OxxnFKZhkRHJSJ6C6.s1cqcrggoOjiEdW9Viqsg21JTUvzClK	2	2026-09-12 18:02:30.177183
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, plate, brand, model, capacity, created_at) FROM stdin;
46dff566-ee95-4094-8156-598d1de4da97	NIG834	PEUGUEOT	408	4	2026-09-14 17:07:50.045147
ecde99fc-57ac-4fcd-a2ca-b45189935fb8	spv613	volkwagen	SENDA	4	2026-09-14 17:08:14.39075
249dd8de-33a6-4e2b-9e63-567b1e995347	ab625nx	peugeot	partner	4	2026-09-14 23:57:21.800275
\.


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 37, true);


--
-- Name: driver_payments driver_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_payments
    ADD CONSTRAINT driver_payments_pkey PRIMARY KEY (id);


--
-- Name: drivers_vehicles drivers_vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers_vehicles
    ADD CONSTRAINT drivers_vehicles_pkey PRIMARY KEY (driver_id, vehicle_id);


--
-- Name: passengers passengers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passengers
    ADD CONSTRAINT passengers_pkey PRIMARY KEY (id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: price_rates price_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.price_rates
    ADD CONSTRAINT price_rates_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_plate_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_key UNIQUE (plate);


--
-- Name: driver_payments driver_payments_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.driver_payments
    ADD CONSTRAINT driver_payments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--
-- Name: drivers_vehicles drivers_vehicles_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers_vehicles
    ADD CONSTRAINT drivers_vehicles_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--
-- Name: drivers_vehicles drivers_vehicles_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drivers_vehicles
    ADD CONSTRAINT drivers_vehicles_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: routes routes_destination_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_destination_place_id_fkey FOREIGN KEY (destination_place_id) REFERENCES public.places(id);


--
-- Name: routes routes_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--
-- Name: routes routes_origin_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_origin_place_id_fkey FOREIGN KEY (origin_place_id) REFERENCES public.places(id);


--
-- Name: routes routes_passenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.passengers(id);


--
-- Name: routes routes_price_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_price_rate_id_fkey FOREIGN KEY (price_rate_id) REFERENCES public.price_rates(id);


--
-- Name: trips trips_destination_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_destination_place_id_fkey FOREIGN KEY (destination_place_id) REFERENCES public.places(id);


--
-- Name: trips trips_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.users(id);


--
-- Name: trips trips_origin_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_origin_place_id_fkey FOREIGN KEY (origin_place_id) REFERENCES public.places(id);


--
-- Name: trips trips_passenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.passengers(id);


--
-- Name: trips trips_price_rate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_price_rate_id_fkey FOREIGN KEY (price_rate_id) REFERENCES public.price_rates(id);


--
-- Name: trips trips_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FgToO0jSKE7lQRrT9eui5UCq4Nc4Egeda2MeJCknYLlrgsCUxHW4ogB49OhbrUt

