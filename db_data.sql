--
-- PostgreSQL database dump
--

\restrict 5xcgzhewLo2cHBakfwoldeABAblYE8nJwcjH6pHJKj5clUfCnFeUxq36mPq3H3z

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (uuid, name, code, address, contact_phone, contact_email, status, settings, created_at, updated_at) FROM stdin;
7f456347-d22c-4218-a768-50f332e8797e	示例学校	demo_school	\N	\N	\N	active	{}	2026-03-07 20:15:56.961362+08	2026-03-07 20:15:56.961362+08
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (uuid, username, password_hash, email, phone, role, school_uuid, status, avatar_url, real_name, student_id, class_info, last_login_at, last_login_device, created_at, updated_at) FROM stdin;
83d744c1-d7db-467a-aef9-0523dea03d0a	school_admin	$2b$10$VoAOARdG7IcLmGDIf/RIX.8A2xL7yucFe8CgZFpkZDNSP97ta.mjW	school@example.com	\N	school_admin	7f456347-d22c-4218-a768-50f332e8797e	active	\N	学校管理员	\N	\N	\N	\N	2026-03-07 20:15:57.099905+08	2026-03-07 20:15:57.099905+08
7eb97d27-edf1-4f2e-90b6-82928ddfe0bf	admin	$2b$10$uPB9s8e1t7ZMLf9isi7W3uRFgeAVNeXgoBnj4iw8un0YyDp8El6uu	admin@example.com	\N	platform_admin	\N	active	\N	系统管理员	\N	\N	2026-03-07 20:16:46.916957+08	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.7705	2026-03-07 20:15:57.037779+08	2026-03-07 20:15:57.037779+08
\.


--
-- Data for Name: operation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operation_logs (id, user_uuid, action, resource, resource_uuid, old_value, new_value, ip_address, user_agent, created_at) FROM stdin;
1	7eb97d27-edf1-4f2e-90b6-82928ddfe0bf	login	user	7eb97d27-edf1-4f2e-90b6-82928ddfe0bf	\N	{"login_time": "2026-03-07T12:16:46.923Z"}	::1	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.7705	2026-03-07 20:16:46.92409+08
\.


--
-- Data for Name: permission_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permission_rules (id, role, resource, actions, scope, description, created_at) FROM stdin;
1	platform_admin	schools	["create", "read", "update", "delete", "ban"]	all	平台管理员可以管理所有学校	2026-03-07 20:15:56.954686+08
2	platform_admin	users	["create", "read", "update", "delete", "ban"]	all	平台管理员可以管理所有用户	2026-03-07 20:15:56.957074+08
3	platform_admin	system_settings	["create", "read", "update"]	all	平台管理员可以配置系统设置	2026-03-07 20:15:56.957726+08
4	school_admin	users	["create", "read", "update", "delete", "ban"]	school	学校管理员可以管理本校用户	2026-03-07 20:15:56.95834+08
5	school_admin	school_settings	["create", "read", "update"]	school	学校管理员可以配置本校统计设置	2026-03-07 20:15:56.958811+08
6	teacher	students	["read"]	class	老师可以查看所带班级学生数据	2026-03-07 20:15:56.959204+08
7	teacher	assignments	["create", "read", "update", "analyze"]	class	老师可以创建和分析作业统计	2026-03-07 20:15:56.959658+08
8	teacher	reports	["create", "read", "update", "delete"]	class	老师可以创建和管理统计报告	2026-03-07 20:15:56.960135+08
9	student	personal_data	["read", "submit"]	self	学生可以查看和提交个人数据	2026-03-07 20:15:56.960619+08
\.


--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_devices (id, user_uuid, device_id, device_name, device_token, expires_at, is_active, created_at, last_login_at) FROM stdin;
1	7eb97d27-edf1-4f2e-90b6-82928ddfe0bf	b80ece0f-c07f-422b-b891-39805a96ca78	Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-CN) WindowsPowerShell/5.1.26100.7705	dfcb0e92-6b69-4489-a0ba-d5f747643e37	2026-03-14 20:16:46.919+08	t	2026-03-07 20:16:46.920575+08	2026-03-07 20:16:46.920575+08
\.


--
-- Name: operation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operation_logs_id_seq', 1, true);


--
-- Name: permission_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.permission_rules_id_seq', 9, true);


--
-- Name: user_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_devices_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 5xcgzhewLo2cHBakfwoldeABAblYE8nJwcjH6pHJKj5clUfCnFeUxq36mPq3H3z

